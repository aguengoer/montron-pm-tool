package dev.montron.pm.integration;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.UUID;

@JsonIgnoreProperties(ignoreUnknown = true)
public record FormSubmissionAttachmentDto(
        UUID id,
        String kind,
        String s3Key,
        String filename,
        Long bytes) {
}
