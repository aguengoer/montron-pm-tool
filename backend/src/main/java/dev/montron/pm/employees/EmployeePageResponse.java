package dev.montron.pm.employees;

import java.util.List;

public record EmployeePageResponse(
        List<EmployeeDto> content,
        int page,
        int size,
        long totalElements,
        int totalPages) {
}
