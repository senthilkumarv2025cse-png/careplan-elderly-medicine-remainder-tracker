package com.careplan.dto;

import com.careplan.enums.DoseStatus;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

public record DoseLogResponse(
        Long id,
        Long scheduleId,
        String medicineName,
        String dosage,
        LocalDate scheduledDate,
        LocalTime scheduledTime,
        DoseStatus status,
        LocalDateTime takenAt,
        LocalDateTime createdAt) {
}