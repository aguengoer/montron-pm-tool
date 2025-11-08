package dev.montron.pm.workday.layout;

import java.util.Map;

public record WorkdayLayoutPayload(
        String documentTypeTb,
        String documentTypeRs,
        Map<String, Object> config) {
}
