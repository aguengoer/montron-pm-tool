package dev.montron.pm.integration;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import dev.montron.pm.integration.config.FormApiConfigService;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpHeaders;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

@Service
public class FormBackendClient {

    public record FormEmployeeCreateRequest(
            String username,
            String firstName,
            String lastName,
            String department,
            String status) {
    }

    public record FormEmployeeUpdateRequest(
            String firstName,
            String lastName,
            String department,
            String status) {
    }

    public record FormEmployeeResponse(
            String id,
            String username,
            String firstName,
            String lastName,
            String team,
            String note,
            String status,
            String role,
            Instant lastLoginAt,
            Instant createdAt,
            Instant updatedAt) {
    }

    public record FormEmployeePage(
            List<FormEmployeeResponse> content,
            @JsonProperty("number") int page,
            int size,
            long totalElements,
            int totalPages) {
    }

    public record FormSubmissionListItem(
            String id,
            String formId,
            String formName,
            Integer formVersion,
            String employeeId,
            String employeeUsername,
            Instant submittedAt,
            Boolean hasAttachments) {
    }

    public record FormSubmissionPage(
            List<FormSubmissionListItem> content,
            @JsonProperty("number") int page,
            int size,
            long totalElements,
            int totalPages) {
    }

    private final WebClient webClient;
    private final FormApiProperties properties;
    private final FormApiConfigService configService;

    public FormBackendClient(
            WebClient formApiWebClient,
            FormApiProperties properties,
            @Lazy FormApiConfigService configService) {
        this.webClient = formApiWebClient;
        this.properties = properties;
        this.configService = configService;
    }

    private String resolveBearerToken() {
        // Priority 1: Service token from database config (per-company configuration)
        Optional<String> dbServiceToken = configService.getServiceToken();
        if (dbServiceToken.isPresent() && !dbServiceToken.get().isBlank()) {
            return "Bearer " + dbServiceToken.get();
        }

        // Priority 2: Service token from environment/properties (fallback)
        if (properties.getServiceToken() != null && !properties.getServiceToken().isBlank()) {
            return "Bearer " + properties.getServiceToken();
        }

        // Priority 3: Legacy technical token (backward compatibility)
        if (properties.getTechnicalToken() != null && !properties.getTechnicalToken().isBlank()) {
            return "Bearer " + properties.getTechnicalToken();
        }

        // Priority 4: User JWT token (for user-initiated requests via frontend)
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof JwtAuthenticationToken jwtAuthentication) {
            return "Bearer " + jwtAuthentication.getToken().getTokenValue();
        }

        throw new IllegalStateException(
                "No authentication token available for Form backend call. " +
                "Please configure the service token in Settings or via form-api.service-token environment variable.");
    }

    public List<FormEmployeeDto> fetchEmployeesIntegration(Instant updatedAfter) {
        return webClient
                .get()
                .uri(uriBuilder -> {
                    var builder = uriBuilder.path("/integration/employees");
                    if (updatedAfter != null) {
                        builder.queryParam("updatedAfter", updatedAfter.toString());
                    }
                    return builder.build();
                })
                .header(HttpHeaders.AUTHORIZATION, resolveBearerToken())
                .retrieve()
                .bodyToFlux(FormEmployeeDto.class)
                .collectList()
                .block();
    }

    public List<FormSubmissionDto> fetchSubmissionsIntegration(
            SubmissionDocumentType documentType,
            LocalDate from,
            LocalDate to,
            Instant updatedAfter) {
        return webClient
                .get()
                .uri(uriBuilder -> {
                    var builder = uriBuilder.path("/integration/submissions")
                            .queryParam("documentType", documentType.name());
                    if (from != null) {
                        builder.queryParam("from", from.toString());
                    }
                    if (to != null) {
                        builder.queryParam("to", to.toString());
                    }
                    if (updatedAfter != null) {
                        builder.queryParam("updatedAfter", updatedAfter.toString());
                    }
                    return builder.build();
                })
                .header(HttpHeaders.AUTHORIZATION, resolveBearerToken())
                .retrieve()
                .bodyToFlux(FormSubmissionDto.class)
                .collectList()
                .block();
    }

    public FormEmployeeResponse createEmployeeInFormBackend(FormEmployeeCreateRequest request) {
        return webClient.post()
                .uri("/employees")
                .header(HttpHeaders.AUTHORIZATION, resolveBearerToken())
                .bodyValue(request)
                .retrieve()
                .bodyToMono(FormEmployeeResponse.class)
                .block();
    }

    public FormEmployeeResponse updateEmployeeInFormBackend(UUID id, FormEmployeeUpdateRequest request) {
        return webClient.put()
                .uri("/employees/{id}", id)
                .header(HttpHeaders.AUTHORIZATION, resolveBearerToken())
                .bodyValue(request)
                .retrieve()
                .bodyToMono(FormEmployeeResponse.class)
                .block();
    }

    public void activateEmployeeInFormBackend(UUID id) {
        webClient.post()
                .uri("/employees/{id}/activate", id)
                .header(HttpHeaders.AUTHORIZATION, resolveBearerToken())
                .retrieve()
                .toBodilessEntity()
                .block();
    }

    public void deactivateEmployeeInFormBackend(UUID id) {
        webClient.post()
                .uri("/employees/{id}/deactivate", id)
                .header(HttpHeaders.AUTHORIZATION, resolveBearerToken())
                .retrieve()
                .toBodilessEntity()
                .block();
    }

    public void resetPasswordInFormBackend(UUID id) {
        webClient.post()
                .uri("/employees/{id}/reset-password", id)
                .header(HttpHeaders.AUTHORIZATION, resolveBearerToken())
                .retrieve()
                .toBodilessEntity()
                .block();
    }

    public FormEmployeePage listEmployees(int page, int size, String search, String status) {
        return webClient.get()
                .uri(uriBuilder -> {
                    var builder = uriBuilder.path("/employees")
                            .queryParam("page", page)
                            .queryParam("size", size);
                    if (search != null && !search.isBlank()) {
                        builder.queryParam("search", search);
                    }
                    if (status != null && !status.isBlank()) {
                        builder.queryParam("status", status);
                    }
                    return builder.build();
                })
                .header(HttpHeaders.AUTHORIZATION, resolveBearerToken())
                .retrieve()
                .bodyToMono(FormEmployeePage.class)
                .block();
    }

    public FormEmployeeResponse getEmployee(UUID id) {
        return webClient.get()
                .uri("/employees/{id}", id)
                .header(HttpHeaders.AUTHORIZATION, resolveBearerToken())
                .retrieve()
                .bodyToMono(FormEmployeeResponse.class)
                .block();
    }

    public FormSubmissionPage listSubmissions(
            Instant from,
            Instant to,
            UUID employeeId,
            UUID formId,
            Boolean hasAttachments,
            int page,
            int size) {
        return webClient.get()
                .uri(uriBuilder -> {
                    var builder = uriBuilder.path("/submissions")
                            .queryParam("page", page)
                            .queryParam("size", size);
                    if (from != null) {
                        builder.queryParam("from", from.toString());
                    }
                    if (to != null) {
                        builder.queryParam("to", to.toString());
                    }
                    if (employeeId != null) {
                        builder.queryParam("employeeId", employeeId.toString());
                    }
                    if (formId != null) {
                        builder.queryParam("formId", formId.toString());
                    }
                    if (hasAttachments != null) {
                        builder.queryParam("hasAttachments", hasAttachments);
                    }
                    return builder.build();
                })
                .header(HttpHeaders.AUTHORIZATION, resolveBearerToken())
                .retrieve()
                .bodyToMono(FormSubmissionPage.class)
                .block();
    }

    /**
     * Get full submission details including all form data
     */
    public record SubmissionDetail(
            String id,
            String formId,
            String formName,
            Integer formVersion,
            String employeeId,
            String employeeUsername,
            Instant submittedAt,
            Boolean hasAttachments,
            java.util.Map<String, Object> data,
            String status,
            String pdfUrl  // Presigned URL to download PDF from S3
    ) {}

    public SubmissionDetail getSubmissionDetail(UUID submissionId) {
        return webClient.get()
                .uri("/submissions/{id}", submissionId)
                .header(HttpHeaders.AUTHORIZATION, resolveBearerToken())
                .retrieve()
                .bodyToMono(SubmissionDetail.class)
                .block();
    }

    /**
     * Get form definition (structure/schema)
     */
    public record FormDefinition(
            String id,
            String name,
            String description,
            Integer version,
            java.util.List<FormField> fields
    ) {}

    public record FormField(
            String id,
            String label,
            String type,
            Boolean required,
            String placeholder,
            JsonNode options,  // Can be array of strings or objects like [{"value":"...","label":"..."}]
            ValidationRules validation
    ) {}

    public record ValidationRules(
            Integer minLength,
            Integer maxLength,
            Integer min,
            Integer max,
            String pattern,
            String errorMessage
    ) {}

    public FormDefinition getFormDefinition(UUID formId) {
        return webClient.get()
                .uri("/forms/{id}", formId)
                .header(HttpHeaders.AUTHORIZATION, resolveBearerToken())
                .retrieve()
                .bodyToMono(FormDefinition.class)
                .block();
    }

    /**
     * Update submission fields
     */
    public SubmissionDetail updateSubmission(UUID submissionId, java.util.Map<String, Object> fieldUpdates) {
        return webClient.patch()
                .uri("/submissions/{id}", submissionId)
                .header(HttpHeaders.AUTHORIZATION, resolveBearerToken())
                .bodyValue(fieldUpdates)
                .retrieve()
                .bodyToMono(SubmissionDetail.class)
                .block();
    }

    /**
     * Regenerate PDF with corrected data
     */
    public record RegeneratePdfResponse(
            String pdfUrl,
            Integer version,
            String pdfObjectKey
    ) {}

    public RegeneratePdfResponse regeneratePdf(UUID submissionId, java.util.Map<String, Object> correctedData) {
        return webClient.post()
                .uri("/submissions/{id}/regenerate-pdf", submissionId)
                .header(HttpHeaders.AUTHORIZATION, resolveBearerToken())
                .bodyValue(correctedData)
                .retrieve()
                .bodyToMono(RegeneratePdfResponse.class)
                .block();
    }

    /**
     * Get presigned URL for PDF object key
     */
    public String getPresignedUrl(String objectKey) {
        record PresignedUrlResponse(String url) {}
        
        PresignedUrlResponse response = webClient.get()
                .uri(uriBuilder -> uriBuilder
                        .path("/submissions/pdf-url")
                        .queryParam("objectKey", objectKey)
                        .build())
                .header(HttpHeaders.AUTHORIZATION, resolveBearerToken())
                .retrieve()
                .bodyToMono(PresignedUrlResponse.class)
                .block();
        
        return response != null ? response.url() : null;
    }
}
