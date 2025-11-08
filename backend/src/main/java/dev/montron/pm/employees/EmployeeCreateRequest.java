package dev.montron.pm.employees;

import jakarta.validation.constraints.NotBlank;

public record EmployeeCreateRequest(
        @NotBlank String username,
        @NotBlank String firstName,
        @NotBlank String lastName,
        @NotBlank String department,
        @NotBlank String status) {
}
