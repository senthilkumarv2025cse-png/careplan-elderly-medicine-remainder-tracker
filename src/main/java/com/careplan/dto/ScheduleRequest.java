package com.careplan.dto;

import com.careplan.enums.Frequency;
import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.time.LocalTime;

public record ScheduleRequest(
        @NotNull(message = "Patient id is required") @Positive(message = "Patient id must be positive") Long patientId,
        @NotNull(message = "Medicine id is required") @Positive(message = "Medicine id must be positive") Long medicineId,
        @NotBlank(message = "Dosage is required") @Size(max = 100, message = "Dosage must be at most 100 characters") String dosage,
        @NotNull(message = "Frequency is required") Frequency frequency,
        @NotNull(message = "Scheduled time is required") LocalTime scheduledTime,
        @NotNull(message = "Start date is required") LocalDate startDate,
        @FutureOrPresent(message = "End date cannot be in the past") LocalDate endDate,
        Boolean active) {
}