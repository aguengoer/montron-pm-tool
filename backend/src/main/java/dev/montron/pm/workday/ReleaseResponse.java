package dev.montron.pm.workday;

import java.time.Instant;
import java.util.UUID;

public record ReleaseResponse(
        UUID workdayId,
        String status,
        Instant releasedAt,
        String targetPath) {
}
