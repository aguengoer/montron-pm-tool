package dev.montron.pm.workday;

import java.math.BigDecimal;
import java.time.LocalTime;

public record StreetwatchEntryDto(
        LocalTime time,
        Integer km,
        BigDecimal lat,
        BigDecimal lon) {
}
