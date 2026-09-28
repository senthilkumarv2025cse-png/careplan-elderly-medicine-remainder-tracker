package com.careplan.service;

import com.careplan.dto.ScheduleRequest;
import com.careplan.dto.ScheduleResponse;
import com.careplan.entity.Medicine;
import com.careplan.entity.Patient;
import com.careplan.entity.Schedule;
import com.careplan.exception.ResourceNotFoundException;
import com.careplan.repository.MedicineRepository;
import com.careplan.repository.PatientRepository;
import com.careplan.repository.ScheduleRepository;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ScheduleService {

    private final ScheduleRepository scheduleRepository;
    private final PatientRepository patientRepository;
    private final MedicineRepository medicineRepository;

    public ScheduleService(
            ScheduleRepository scheduleRepository,
            PatientRepository patientRepository,
            MedicineRepository medicineRepository) {
        this.scheduleRepository = scheduleRepository;
        this.patientRepository = patientRepository;
        this.medicineRepository = medicineRepository;
    }

    public ScheduleResponse create(ScheduleRequest request) {
        validate(request);
        Schedule schedule = new Schedule();
        apply(schedule, request);
        return toResponse(scheduleRepository.save(schedule));
    }

    @Transactional(readOnly = true)
    public ScheduleResponse findById(Long id) {
        return toResponse(getSchedule(id));
    }

    @Transactional(readOnly = true)
    public List<ScheduleResponse> findByPatientId(Long patientId) {
        getPatient(patientId);
        return scheduleRepository.findAllByPatientId(patientId).stream()
                .map(this::toResponse).toList();
    }

    public ScheduleResponse update(Long id, ScheduleRequest request) {
        validate(request);
        Schedule schedule = getSchedule(id);
        apply(schedule, request);
        return toResponse(scheduleRepository.save(schedule));
    }

    public void delete(Long id) {
        scheduleRepository.delete(getSchedule(id));
    }

    public ScheduleResponse activate(Long id) {
        Schedule schedule = getSchedule(id);
        schedule.setActive(true);
        return toResponse(scheduleRepository.save(schedule));
    }

    public ScheduleResponse deactivate(Long id) {
        Schedule schedule = getSchedule(id);
        schedule.setActive(false);
        return toResponse(scheduleRepository.save(schedule));
    }

    private void validate(ScheduleRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Schedule request is required");
        }
        if (request.patientId() == null) {
            throw new IllegalArgumentException("Patient id is required");
        }
        if (request.medicineId() == null) {
            throw new IllegalArgumentException("Medicine id is required");
        }
        if (request.dosage() == null || request.dosage().isBlank() || request.dosage().length() > 100) {
            throw new IllegalArgumentException("Dosage is required and must be at most 100 characters");
        }
        if (request.frequency() == null) {
            throw new IllegalArgumentException("Frequency is required");
        }
        if (request.scheduledTime() == null) {
            throw new IllegalArgumentException("Scheduled time is required");
        }
        if (request.startDate() == null) {
            throw new IllegalArgumentException("Start date is required");
        }
        if (request.endDate() != null && request.endDate().isBefore(request.startDate())) {
            throw new IllegalArgumentException("End date cannot be before start date");
        }
        if (request.active() == null) {
            throw new IllegalArgumentException("Active status is required");
        }
        getPatient(request.patientId());
        getMedicine(request.medicineId());
    }

    private void apply(Schedule schedule, ScheduleRequest request) {
        Patient patient = getPatient(request.patientId());
        Medicine medicine = getMedicine(request.medicineId());
        schedule.setPatient(patient);
        schedule.setMedicine(medicine);
        schedule.setDosage(request.dosage().trim());
        schedule.setFrequency(request.frequency());
        schedule.setScheduledTime(request.scheduledTime());
        schedule.setStartDate(request.startDate());
        schedule.setEndDate(request.endDate());
        schedule.setActive(request.active());
    }

    private Schedule getSchedule(Long id) {
        return scheduleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Schedule", id));
    }

    private Patient getPatient(Long id) {
        return patientRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Patient", id));
    }

    private Medicine getMedicine(Long id) {
        return medicineRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Medicine", id));
    }

    private ScheduleResponse toResponse(Schedule schedule) {
        return new ScheduleResponse(schedule.getId(), schedule.getPatient().getId(),
                schedule.getMedicine().getId(), schedule.getMedicine().getName(),
                schedule.getDosage(), schedule.getFrequency(), schedule.getScheduledTime(),
                schedule.getStartDate(), schedule.getEndDate(), schedule.getActive());
    }
}