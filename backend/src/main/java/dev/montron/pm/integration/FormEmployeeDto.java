package dev.montron.pm.integration;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.Instant;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public record FormEmployeeDto(
        UUID id,
        String username,
        String firstName,
        String lastName,
        String department,
        String status,
        Instant updatedAt,
        String etag) {
}
