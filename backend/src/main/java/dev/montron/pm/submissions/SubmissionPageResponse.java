package dev.montron.pm.submissions;

import java.util.List;

public record SubmissionPageResponse(
        List<SubmissionDto> content,
        int page,
        int size,
        long totalElements,
        int totalPages) {
}
