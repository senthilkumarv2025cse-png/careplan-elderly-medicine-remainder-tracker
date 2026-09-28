package com.careplan.repository;

import com.careplan.entity.Schedule;
import java.util.List;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import jakarta.persistence.LockModeType;

public interface ScheduleRepository extends JpaRepository<Schedule, Long> {

    List<Schedule> findAllByPatientId(Long patientId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select schedule from Schedule schedule "
            + "where schedule.patient.id = :patientId and schedule.active = true "
            + "order by schedule.id")
    List<Schedule> findActiveByPatientIdForUpdate(@Param("patientId") Long patientId);
}