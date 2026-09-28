package com.careplan.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MedicineRequest(
        @NotBlank(message = "Medicine name is required")
        @Size(max = 100, message = "Medicine name must be at most 100 characters") String name,
        @NotBlank(message = "Dosage is required")
        @Size(max = 100, message = "Dosage must be at most 100 characters") String dosage,
        @Size(max = 500, message = "Description must be at most 500 characters") String description) {
}