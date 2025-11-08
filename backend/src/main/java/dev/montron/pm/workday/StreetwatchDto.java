package dev.montron.pm.workday;

import java.time.LocalDate;
import java.util.List;

public record StreetwatchDto(
        String licensePlate,
        LocalDate date,
        List<StreetwatchEntryDto> entries) {
}
