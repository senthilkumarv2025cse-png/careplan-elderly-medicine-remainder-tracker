package com.careplan.dto;

import com.careplan.enums.Frequency;
import java.time.LocalDate;
import java.time.LocalTime;

public record ScheduleResponse(
        Long id,
        Long patientId,
        Long medicineId,
        String medicineName,
        String dosage,
        Frequency frequency,
        LocalTime scheduledTime,
        LocalDate startDate,
        LocalDate endDate,
        Boolean active) {
}