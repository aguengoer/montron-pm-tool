package dev.montron.pm.employees;

import java.util.UUID;

public record EmployeeDto(
        UUID id,
        String username,
        String firstName,
        String lastName,
        String department,
        String status) {
}
