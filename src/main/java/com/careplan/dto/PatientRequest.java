package com.careplan.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

public record PatientRequest(
        @NotBlank(message = "Name is required")
        @Size(max = 100, message = "Name must be at most 100 characters") String name,
        @NotNull(message = "Age is required")
        @Positive(message = "Age must be greater than zero")
        @Max(value = 130, message = "Age must be at most 130") Integer age,
        @NotBlank(message = "Phone is required")
        @Pattern(regexp = "[+0-9(). -]{7,20}", message = "Phone format is invalid") String phone,
        @NotBlank(message = "Address is required")
        @Size(max = 255, message = "Address must be at most 255 characters") String address) {
}