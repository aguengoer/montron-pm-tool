package dev.montron.pm.config;

import dev.montron.pm.common.ErrorResponse;
import dev.montron.pm.common.ErrorResponse.ValidationError;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import java.util.List;
import java.util.stream.Collectors;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;

@ControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValid(MethodArgumentNotValidException ex) {
        List<ValidationError> errors = ex.getBindingResult().getFieldErrors().stream()
                .map(fieldError -> new ValidationError(fieldError.getField(), resolveMessage(fieldError)))
                .collect(Collectors.toList());

        return ResponseEntity.badRequest()
                .body(ErrorResponse.badRequest("Validation failed", errors));
    }

    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(ConstraintViolationException ex) {
        List<ValidationError> errors = ex.getConstraintViolations().stream()
                .map(this::mapConstraintViolation)
                .collect(Collectors.toList());

        return ResponseEntity.badRequest()
                .body(ErrorResponse.badRequest("Validation failed", errors));
    }

    private ValidationError mapConstraintViolation(ConstraintViolation<?> violation) {
        String field = violation.getPropertyPath() != null ? violation.getPropertyPath().toString() : "";
        return new ValidationError(field, violation.getMessage());
    }

    private String resolveMessage(FieldError fieldError) {
        return fieldError.getDefaultMessage();
    }
}
