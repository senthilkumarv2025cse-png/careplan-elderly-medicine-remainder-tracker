package com.careplan.dto;

import java.time.LocalDate;
import java.time.LocalTime;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record DoseLogRequest(
	@NotNull(message = "Schedule id is required") @Positive(message = "Schedule id must be positive") Long scheduleId,
	@NotNull(message = "Scheduled date is required") LocalDate scheduledDate,
	@NotNull(message = "Scheduled time is required") LocalTime scheduledTime) {
}