package com.careplan.dto;

import java.time.LocalDate;
import java.time.LocalTime;

public record DoseLogRequest(Long scheduleId, LocalDate scheduledDate, LocalTime scheduledTime) {
}