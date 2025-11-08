package dev.montron.pm.workday;

import java.util.UUID;

public record WorkdayEmployeeDto(
        UUID id,
        String username,
        String firstName,
        String lastName,
        String department) {
}
