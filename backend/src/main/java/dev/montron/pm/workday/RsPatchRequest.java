package dev.montron.pm.workday;

import java.time.LocalTime;
import java.util.List;

public record RsPatchRequest(
        LocalTime startTime,
        LocalTime endTime,
        Integer breakMinutes,
        String customerId,
        String customerName,
        List<RsPositionDto> positions) {
}
