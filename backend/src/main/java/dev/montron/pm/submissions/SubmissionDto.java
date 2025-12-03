package dev.montron.pm.submissions;

import java.time.Instant;
import java.util.UUID;

public record SubmissionDto(
        UUID id,
        UUID formId,
        String formName,
        Integer formVersion,
        UUID employeeId,
        String employeeUsername,
        Instant submittedAt,
        Boolean hasAttachments) {
}
