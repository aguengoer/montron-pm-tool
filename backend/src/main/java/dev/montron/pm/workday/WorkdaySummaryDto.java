package dev.montron.pm.workday;

import java.time.LocalDate;
import java.util.UUID;

public record WorkdaySummaryDto(
        UUID id,
        LocalDate date,
        String status,
        boolean hasTb,
        boolean hasRs,
        boolean hasStreetwatch) {
}
