package com.careplan.exception;

import org.springframework.http.HttpStatus;

public class DuplicateDoseLogException extends BusinessException {

    public DuplicateDoseLogException(String message) {
        super(message, HttpStatus.CONFLICT);
    }
}