package dev.montron.pm.workday;

import java.time.LocalTime;
import java.util.List;
import java.util.UUID;

public record RsDto(
        UUID id,
        UUID sourceSubmissionId,
        String customerId,
        String customerName,
        LocalTime startTime,
        LocalTime endTime,
        Integer breakMinutes,
        List<RsPositionDto> positions,
        String pdfObjectKey,
        Integer version) {
}
