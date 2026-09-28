package com.careplan.exception;

import jakarta.validation.ConstraintViolationException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiError> handleValidation(MethodArgumentNotValidException exception) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        exception.getBindingResult().getFieldErrors().forEach(error ->
                fieldErrors.putIfAbsent(error.getField(), error.getDefaultMessage()));
        return error(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", "Invalid request", fieldErrors);
    }

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiError> handleNotFound(ResourceNotFoundException exception) {
        return error(HttpStatus.NOT_FOUND, "NOT_FOUND", exception.getMessage(), Map.of());
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ApiError> handleBusiness(BusinessException exception) {
        return error(exception.getStatus(), "BUSINESS_ERROR", exception.getMessage(), Map.of());
    }

    @ExceptionHandler({
        IllegalArgumentException.class,
        ConstraintViolationException.class,
        HttpMessageNotReadableException.class,
        MethodArgumentTypeMismatchException.class,
        MissingServletRequestParameterException.class
    })
    public ResponseEntity<ApiError> handleBadRequest(Exception exception) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();
        String message = exception.getMessage();
        if (exception instanceof MethodArgumentTypeMismatchException mismatchException) {
            String detail = mismatchException.getRequiredType() == LocalDate.class
                    ? "must be a date in YYYY-MM-DD format"
                    : "has an invalid value";
            fieldErrors.put(mismatchException.getName(), detail);
            message = "Invalid request parameter";
        } else if (exception instanceof MissingServletRequestParameterException missingParameter) {
            fieldErrors.put(missingParameter.getParameterName(), "is required");
            message = "Invalid request parameter";
        } else if (exception instanceof HttpMessageNotReadableException) {
            message = "Request body is invalid";
        } else if (exception instanceof ConstraintViolationException violations) {
            fieldErrors = violations.getConstraintViolations().stream().collect(Collectors.toMap(
                    violation -> violation.getPropertyPath().toString(),
                    violation -> violation.getMessage(),
                    (first, second) -> first,
                    LinkedHashMap::new));
            message = "Invalid request";
        }
        return error(HttpStatus.BAD_REQUEST, "VALIDATION_ERROR", message, fieldErrors);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiError> handleUnexpected(Exception exception) {
        return error(HttpStatus.INTERNAL_SERVER_ERROR, "INTERNAL_SERVER_ERROR",
                "An unexpected error occurred", Map.of());
    }

    private ResponseEntity<ApiError> error(
            HttpStatus status, String error, String message, Map<String, String> fieldErrors) {
        ApiError response = new ApiError(LocalDateTime.now(), status.value(), error, message, fieldErrors);
        return ResponseEntity.status(status).body(response);
    }
}