package com.careplan.repository;

import com.careplan.entity.DoseLog;
import com.careplan.enums.DoseStatus;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface DoseLogRepository extends JpaRepository<DoseLog, Long> {

    Optional<DoseLog> findByScheduleIdAndScheduledDateAndScheduledTime(
            Long scheduleId, LocalDate scheduledDate, LocalTime scheduledTime);

    List<DoseLog> findAllBySchedule_IdInAndScheduledDate(
            Collection<Long> scheduleIds, LocalDate scheduledDate);

    List<DoseLog> findAllBySchedule_Patient_IdAndScheduledDateBetweenOrderByScheduledDateAscScheduledTimeAsc(
            Long patientId, LocalDate from, LocalDate to);

    List<DoseLog> findAllBySchedule_Patient_IdAndStatusNotAndScheduledDateLessThanEqualOrderByScheduledDateAscScheduledTimeAsc(
            Long patientId, DoseStatus status, LocalDate throughDate);
}