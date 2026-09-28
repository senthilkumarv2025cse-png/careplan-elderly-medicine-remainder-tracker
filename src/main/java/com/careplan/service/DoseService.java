package com.careplan.service;

import com.careplan.dto.DoseLogRequest;
import com.careplan.dto.DoseLogResponse;
import com.careplan.dto.OverdueDoseResponse;
import com.careplan.entity.DoseLog;
import com.careplan.entity.Patient;
import com.careplan.entity.Schedule;
import com.careplan.enums.DoseStatus;
import com.careplan.enums.Frequency;
import com.careplan.exception.DoseAlreadyTakenException;
import com.careplan.exception.DuplicateDoseLogException;
import com.careplan.exception.ResourceNotFoundException;
import com.careplan.repository.DoseLogRepository;
import com.careplan.repository.PatientRepository;
import com.careplan.repository.ScheduleRepository;
import java.time.LocalDate;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class DoseService {

    private static final String DUPLICATE_DOSE_MESSAGE =
            "A dose log already exists for this schedule, date, and time.";

    private final DoseLogRepository doseLogRepository;
    private final ScheduleRepository scheduleRepository;
    private final PatientRepository patientRepository;
    private final Duration overdueThreshold;

    public DoseService(
            DoseLogRepository doseLogRepository,
            ScheduleRepository scheduleRepository,
            PatientRepository patientRepository,
            @Value("${careplan.doses.overdue-threshold:PT1H}") Duration overdueThreshold) {
        this.doseLogRepository = doseLogRepository;
        this.scheduleRepository = scheduleRepository;
        this.patientRepository = patientRepository;
        if (overdueThreshold.isNegative()) {
            throw new IllegalArgumentException("Overdue threshold cannot be negative");
        }
        this.overdueThreshold = overdueThreshold;
    }

    public DoseLogResponse create(DoseLogRequest request) {
        validate(request);
        Schedule schedule = scheduleRepository.findById(request.scheduleId())
                .orElseThrow(() -> new ResourceNotFoundException("Schedule", request.scheduleId()));

        if (doseLogRepository.findByScheduleIdAndScheduledDateAndScheduledTime(
                request.scheduleId(), request.scheduledDate(), request.scheduledTime()).isPresent()) {
            throw new DuplicateDoseLogException(DUPLICATE_DOSE_MESSAGE);
        }

        DoseLog doseLog = new DoseLog();
        doseLog.setSchedule(schedule);
        doseLog.setScheduledDate(request.scheduledDate());
        doseLog.setScheduledTime(request.scheduledTime());
        doseLog.setStatus(DoseStatus.PENDING);
        return toResponse(saveNewDoseLog(doseLog));
    }

    public List<DoseLogResponse> getTodaysExpectedDoses(Long patientId) {
        patientRepository.findById(patientId)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", patientId));

        LocalDate today = LocalDate.now();
        List<Schedule> activeSchedules = scheduleRepository.findActiveByPatientIdForUpdate(patientId);
        List<Schedule> applicableSchedules = activeSchedules.stream()
                .filter(schedule -> appliesOn(schedule, today))
                .toList();

        if (applicableSchedules.isEmpty()) {
            return List.of();
        }

        Collection<Long> scheduleIds = applicableSchedules.stream().map(Schedule::getId).toList();
        Map<DoseKey, DoseLog> logsByScheduleAndTime = new HashMap<>();
        doseLogRepository.findAllBySchedule_IdInAndScheduledDate(scheduleIds, today)
                .forEach(log -> logsByScheduleAndTime.put(
                        new DoseKey(log.getSchedule().getId(), log.getScheduledTime()), log));

        List<DoseLogResponse> responses = new ArrayList<>();
        for (Schedule schedule : applicableSchedules) {
            DoseKey key = new DoseKey(schedule.getId(), schedule.getScheduledTime());
            DoseLog doseLog = logsByScheduleAndTime.get(key);
            if (doseLog == null) {
                doseLog = new DoseLog();
                doseLog.setSchedule(schedule);
                doseLog.setScheduledDate(today);
                doseLog.setScheduledTime(schedule.getScheduledTime());
                doseLog.setStatus(DoseStatus.PENDING);
                doseLog = saveNewDoseLog(doseLog);
                logsByScheduleAndTime.put(key, doseLog);
            }
            responses.add(toResponse(doseLog));
        }
        return responses;
    }

    public DoseLogResponse markAsTaken(Long doseId) {
        DoseLog doseLog = doseLogRepository.findById(doseId)
                .orElseThrow(() -> new ResourceNotFoundException("DoseLog", doseId));
        if (doseLog.getStatus() == DoseStatus.TAKEN) {
            throw new DoseAlreadyTakenException();
        }
        doseLog.setStatus(DoseStatus.TAKEN);
        doseLog.setTakenAt(LocalDateTime.now());
        return toResponse(doseLogRepository.save(doseLog));
    }

        @Transactional(readOnly = true)
        public List<DoseLogResponse> getMissedDoses(Long patientId, LocalDate from, LocalDate to) {
        patientRepository.findById(patientId)
            .orElseThrow(() -> new ResourceNotFoundException("Patient", patientId));
        if (from == null) {
            throw new IllegalArgumentException("From date is required");
        }
        if (to == null) {
            throw new IllegalArgumentException("To date is required");
        }
        if (from.isAfter(to)) {
            throw new IllegalArgumentException("From date cannot be after to date");
        }

        LocalDateTime now = LocalDateTime.now();
        return doseLogRepository
            .findAllBySchedule_Patient_IdAndScheduledDateBetweenOrderByScheduledDateAscScheduledTimeAsc(
                patientId, from, to)
            .stream()
            .filter(doseLog -> doseLog.getStatus() == DoseStatus.MISSED || isOverdue(doseLog, now))
            .map(doseLog -> toResponse(doseLog,
                doseLog.getStatus() == DoseStatus.MISSED ? DoseStatus.MISSED : DoseStatus.OVERDUE))
            .toList();
        }

        @Transactional(readOnly = true)
        public List<OverdueDoseResponse> getOverdueDoses(Long patientId) {
        Patient patient = patientRepository.findById(patientId)
            .orElseThrow(() -> new ResourceNotFoundException("Patient", patientId));
        LocalDateTime now = LocalDateTime.now();
        return doseLogRepository
            .findAllBySchedule_Patient_IdAndStatusNotAndScheduledDateLessThanEqualOrderByScheduledDateAscScheduledTimeAsc(
                patientId, DoseStatus.TAKEN, now.toLocalDate())
            .stream()
            .filter(doseLog -> isOverdue(doseLog, now))
            .map(doseLog -> new OverdueDoseResponse(
                doseLog.getId(), patient.getId(), patient.getName(),
                doseLog.getSchedule().getMedicine().getName(), doseLog.getSchedule().getDosage(),
                doseLog.getScheduledDate(), doseLog.getScheduledTime(), DoseStatus.OVERDUE))
            .toList();
        }

    private void validate(DoseLogRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Dose log request is required");
        }
        if (request.scheduleId() == null) {
            throw new IllegalArgumentException("Schedule id is required");
        }
        if (request.scheduledDate() == null) {
            throw new IllegalArgumentException("Scheduled date is required");
        }
        if (request.scheduledTime() == null) {
            throw new IllegalArgumentException("Scheduled time is required");
        }
    }

    private boolean appliesOn(Schedule schedule, LocalDate date) {
        if (schedule.getStartDate().isAfter(date)
                || (schedule.getEndDate() != null && schedule.getEndDate().isBefore(date))) {
            return false;
        }
        if (schedule.getFrequency() == Frequency.DAILY) {
            return true;
        }
        return schedule.getFrequency() == Frequency.WEEKLY
                && ChronoUnit.DAYS.between(schedule.getStartDate(), date) % 7 == 0;
    }

    private boolean isOverdue(DoseLog doseLog, LocalDateTime now) {
        return doseLog.getStatus() != DoseStatus.TAKEN
                && now.isAfter(LocalDateTime.of(doseLog.getScheduledDate(), doseLog.getScheduledTime())
                        .plus(overdueThreshold));
    }

    private DoseLog saveNewDoseLog(DoseLog doseLog) {
        try {
            return doseLogRepository.saveAndFlush(doseLog);
        } catch (DataIntegrityViolationException exception) {
            throw new DuplicateDoseLogException(DUPLICATE_DOSE_MESSAGE);
        }
    }

    private DoseLogResponse toResponse(DoseLog doseLog) {
        return toResponse(doseLog, doseLog.getStatus());
    }

    private DoseLogResponse toResponse(DoseLog doseLog, DoseStatus status) {
        Schedule schedule = doseLog.getSchedule();
        return new DoseLogResponse(doseLog.getId(), schedule.getId(),
                schedule.getMedicine().getName(), schedule.getDosage(),
                doseLog.getScheduledDate(), doseLog.getScheduledTime(), status,
                doseLog.getTakenAt(), doseLog.getCreatedAt());
    }

    private record DoseKey(Long scheduleId, java.time.LocalTime scheduledTime) {
    }
}