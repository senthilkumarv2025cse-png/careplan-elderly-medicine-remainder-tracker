package com.careplan.exception;

public class DoseAlreadyTakenException extends RuntimeException {

    public DoseAlreadyTakenException() {
        super("Dose has already been marked as taken for this scheduled time.");
    }
}