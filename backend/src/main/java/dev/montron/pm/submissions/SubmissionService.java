package dev.montron.pm.submissions;

import dev.montron.pm.integration.FormBackendClient;
import dev.montron.pm.integration.FormBackendClient.FormSubmissionListItem;
import dev.montron.pm.integration.FormBackendClient.FormSubmissionPage;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class SubmissionService {

    private final FormBackendClient formBackendClient;

    public SubmissionService(FormBackendClient formBackendClient) {
        this.formBackendClient = formBackendClient;
    }

    public SubmissionPageResponse listSubmissions(
            Instant from,
            Instant to,
            UUID employeeId,
            UUID formId,
            Boolean hasAttachments,
            int page,
            int size) {
        
        // Proxy request directly to form builder backend
        FormSubmissionPage formPage = formBackendClient.listSubmissions(
                from, to, employeeId, formId, hasAttachments, page, size);
        
        // Map form builder response to PM tool format
        List<SubmissionDto> content = formPage.content().stream()
                .map(this::toDto)
                .toList();

        return new SubmissionPageResponse(
                content,
                formPage.page(),
                formPage.size(),
                formPage.totalElements(),
                formPage.totalPages());
    }

    public SubmissionPageResponse listSubmissionsByDate(UUID employeeId, String date) {
        // Convert date string (YYYY-MM-DD) to Instant range
        Instant from = Instant.parse(date + "T00:00:00Z");
        Instant to = Instant.parse(date + "T23:59:59Z");
        
        // Fetch all submissions for this employee on this date
        return listSubmissions(from, to, employeeId, null, null, 0, 1000);
    }

    private SubmissionDto toDto(FormSubmissionListItem item) {
        return new SubmissionDto(
                UUID.fromString(item.id()),
                UUID.fromString(item.formId()),
                item.formName(),
                item.formVersion(),
                UUID.fromString(item.employeeId()),
                item.employeeUsername(),
                item.submittedAt(),
                item.hasAttachments());
    }
}
