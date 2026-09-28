package com.careplan.dto;

import java.time.LocalDateTime;

public record MedicineResponse(
        Long id,
        String name,
        String dosage,
        String description,
        LocalDateTime createdAt) {
}