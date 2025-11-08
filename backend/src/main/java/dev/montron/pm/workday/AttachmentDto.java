package dev.montron.pm.workday;

import java.util.UUID;

public record AttachmentDto(
        UUID id,
        String kind,
        String filename,
        String s3Key,
        Long bytes,
        UUID sourceSubmissionId) {
}
