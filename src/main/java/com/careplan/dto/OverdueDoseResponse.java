package com.careplan.dto;

import com.careplan.enums.DoseStatus;
import java.time.LocalDate;
import java.time.LocalTime;

public record OverdueDoseResponse(
        Long doseId,
        Long patientId,
        String patientName,
        String medicineName,
        String dosage,
        LocalDate scheduledDate,
        LocalTime scheduledTime,
        DoseStatus status) {
}