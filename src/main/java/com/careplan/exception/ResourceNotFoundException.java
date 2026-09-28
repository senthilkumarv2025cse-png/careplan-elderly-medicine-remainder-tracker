package com.careplan.exception;

public class ResourceNotFoundException extends BusinessException {

    public ResourceNotFoundException(String resource, Long id) {
        super(resource + " not found with id " + id, org.springframework.http.HttpStatus.NOT_FOUND);
    }
}