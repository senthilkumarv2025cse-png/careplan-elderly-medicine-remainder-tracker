package com.careplan.dto;

import com.careplan.enums.Frequency;
import java.time.LocalDate;
import java.time.LocalTime;

public record ScheduleRequest(
        Long patientId,
        Long medicineId,
        String dosage,
        Frequency frequency,
        LocalTime scheduledTime,
        LocalDate startDate,
        LocalDate endDate,
        Boolean active) {
}