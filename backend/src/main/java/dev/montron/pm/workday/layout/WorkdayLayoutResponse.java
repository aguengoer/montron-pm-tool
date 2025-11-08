package dev.montron.pm.workday.layout;

import java.util.Map;

public record WorkdayLayoutResponse(
        String name,
        String documentTypeTb,
        String documentTypeRs,
        Map<String, Object> config) {
}
