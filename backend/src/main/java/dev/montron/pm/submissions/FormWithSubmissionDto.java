package dev.montron.pm.submissions;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Combines form definition with actual submission data.
 * This allows the frontend to render any form dynamically.
 */
public record FormWithSubmissionDto(
        // Form structure
        FormDefinitionDto formDefinition,
        
        // Submission data
        UUID submissionId,
        Map<String, Object> data,           // Current values
        Map<String, Object> originalData,   // Original values (for change tracking)
        boolean hasChanges,
        
        // Metadata
        UUID formId,
        String formVersion,
        Instant submittedAt,
        String submittedBy,
        SubmissionStatus status,
        String pdfUrl  // Presigned URL to download PDF from S3
) {
    public enum SubmissionStatus {
        DRAFT,
        SUBMITTED,
        APPROVED,
        REJECTED
    }
}

