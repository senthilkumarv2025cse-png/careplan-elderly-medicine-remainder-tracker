package com.careplan.dto;

import java.time.LocalDateTime;

public record PatientResponse(
        Long id,
        String name,
        Integer age,
        String phone,
        String address,
        LocalDateTime createdAt) {
}