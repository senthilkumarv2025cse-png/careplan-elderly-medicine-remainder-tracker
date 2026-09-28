package com.careplan.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record PatientRequest(
        @NotBlank @Size(max = 100) String name,
        @NotNull @Min(0) @Max(130) Integer age,
        @NotBlank @Pattern(regexp = "[+0-9(). -]{7,20}") String phone,
        @NotBlank @Size(max = 255) String address) {
}