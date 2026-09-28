package com.careplan.exception;

import org.springframework.http.HttpStatus;

public class DoseAlreadyTakenException extends BusinessException {

    public DoseAlreadyTakenException() {
        super("Dose has already been marked as taken for this scheduled time.", HttpStatus.CONFLICT);
    }
}