package com.careplan.repository;

import com.careplan.entity.DoseLog;
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
}