package com.careplan.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record MedicineRequest(
        @NotBlank @Size(max = 100) String name,
        @NotBlank @Size(max = 100) String dosage,
        @Size(max = 500) String description) {
}