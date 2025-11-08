package dev.montron.pm.workday;

import java.util.Map;
import java.util.UUID;

public record ValidationIssueDto(
        UUID id,
        String code,
        String severity,
        String message,
        String fieldRef,
        Map<String, Object> delta) {
}
