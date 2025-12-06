package dev.montron.pm.submissions;

import com.fasterxml.jackson.databind.ObjectMapper;
import dev.montron.pm.common.CurrentUser;
import dev.montron.pm.common.CurrentUserService;
import dev.montron.pm.integration.FormBackendClient;
import dev.montron.pm.integration.FormBackendClient.FormSubmissionListItem;
import dev.montron.pm.integration.FormBackendClient.FormSubmissionPage;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.stereotype.Service;

@Service
public class SubmissionService {

    private final FormBackendClient formBackendClient;
    private final SubmissionFieldCorrectionRepository correctionRepository;
    private final SubmissionPdfVersionRepository pdfVersionRepository;
    private final ObjectMapper objectMapper;
    private final CurrentUserService currentUserService;

    public SubmissionService(
            FormBackendClient formBackendClient,
            SubmissionFieldCorrectionRepository correctionRepository,
            SubmissionPdfVersionRepository pdfVersionRepository,
            ObjectMapper objectMapper,
            CurrentUserService currentUserService) {
        this.formBackendClient = formBackendClient;
        this.correctionRepository = correctionRepository;
        this.pdfVersionRepository = pdfVersionRepository;
        this.objectMapper = objectMapper;
        this.currentUserService = currentUserService;
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

    /**
     * Save field corrections in PM tool database.
     * Original data stays in mobile app, corrections are stored here.
     */
    @Transactional
    public void saveFieldCorrections(UUID submissionId, Map<String, Object> fieldUpdates) {
        // Get current user
        CurrentUser currentUser = currentUserService.getCurrentUser();
        UUID userId = currentUser.userId();

        // Get original submission data from mobile app (for audit trail)
        FormBackendClient.SubmissionDetail originalSubmission = formBackendClient.getSubmissionDetail(submissionId);

        // Save or update each field correction
        for (Map.Entry<String, Object> entry : fieldUpdates.entrySet()) {
            String fieldId = entry.getKey();
            Object newValue = entry.getValue();

            // Get original value
            Object originalValue = originalSubmission.data().get(fieldId);

            // Find existing correction or create new
            SubmissionFieldCorrection correction = correctionRepository
                    .findBySubmissionIdAndFieldId(submissionId, fieldId)
                    .orElse(new SubmissionFieldCorrection());

            correction.setSubmissionId(submissionId);
            correction.setFieldId(fieldId);
            correction.setCorrectedValue(convertToString(newValue));
            
            // Only set original value on first correction (don't overwrite)
            if (correction.getId() == null) {
                correction.setOriginalValue(convertToString(originalValue));
            }
            
            correction.setCorrectedBy(userId);

            correctionRepository.save(correction);
        }

        // Regenerate PDF with all corrections
        regeneratePdfWithCorrections(submissionId, userId);
    }

    /**
     * Regenerate PDF with all current corrections
     */
    private void regeneratePdfWithCorrections(UUID submissionId, UUID userId) {
        // Get all corrections for this submission
        Map<String, Object> allCorrections = getCorrections(submissionId);
        
        if (allCorrections.isEmpty()) {
            // No corrections, no need to regenerate
            return;
        }

        // Check if we already have a corrected version
        Optional<SubmissionPdfVersion> existingVersion = pdfVersionRepository
                .findLatestBySubmissionId(submissionId);

        // Call mobile app to regenerate PDF with merged data
        FormBackendClient.RegeneratePdfResponse pdfResponse = 
                formBackendClient.regeneratePdf(submissionId, allCorrections);

        if (existingVersion.isPresent()) {
            // Update existing version (user is refining the corrections)
            SubmissionPdfVersion pdfVersion = existingVersion.get();
            pdfVersion.setPdfObjectKey(pdfResponse.pdfObjectKey());
            pdfVersion.setCreatedBy(userId);
            pdfVersionRepository.save(pdfVersion);
        } else {
            // Create first corrected version (v2)
            SubmissionPdfVersion pdfVersion = new SubmissionPdfVersion();
            pdfVersion.setSubmissionId(submissionId);
            pdfVersion.setVersion(pdfResponse.version());
            pdfVersion.setPdfObjectKey(pdfResponse.pdfObjectKey());
            pdfVersion.setCreatedBy(userId);
            pdfVersionRepository.save(pdfVersion);
        }
    }

    /**
     * Get corrections for a submission
     */
    public Map<String, Object> getCorrections(UUID submissionId) {
        List<SubmissionFieldCorrection> corrections = correctionRepository.findBySubmissionId(submissionId);
        
        return corrections.stream()
                .collect(java.util.stream.Collectors.toMap(
                        SubmissionFieldCorrection::getFieldId,
                        c -> parseValue(c.getCorrectedValue())
                ));
    }

    /**
     * Get the latest PDF URL for a submission.
     * Returns corrected version (v2, v3, ...) if exists, otherwise original (v1).
     */
    public String getLatestPdfUrl(UUID submissionId, String originalPdfUrl) {
        // Check if there's a corrected version
        Optional<SubmissionPdfVersion> latestVersion = pdfVersionRepository.findLatestBySubmissionId(submissionId);
        
        if (latestVersion.isPresent()) {
            // Return corrected PDF URL (need to get presigned URL from mobile app)
            String pdfObjectKey = latestVersion.get().getPdfObjectKey();
            // TODO: We need a method to get presigned URL for a specific object key
            // For now, we'll need to add this to FormBackendClient
            return formBackendClient.getPresignedUrl(pdfObjectKey);
        }
        
        // No corrected version, return original
        return originalPdfUrl;
    }

    private String convertToString(Object value) {
        if (value == null) {
            return null;
        }
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            return value.toString();
        }
    }

    private Object parseValue(String value) {
        if (value == null) {
            return null;
        }
        try {
            return objectMapper.readValue(value, Object.class);
        } catch (Exception e) {
            return value;
        }
    }
}
