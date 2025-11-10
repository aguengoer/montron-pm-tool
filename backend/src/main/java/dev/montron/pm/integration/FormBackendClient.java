package dev.montron.pm.integration;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
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

    private final WebClient webClient;
    private final FormApiProperties properties;

    public FormBackendClient(WebClient formApiWebClient, FormApiProperties properties) {
        this.webClient = formApiWebClient;
        this.properties = properties;
    }

    private String resolveBearerToken() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication instanceof JwtAuthenticationToken jwtAuthentication) {
            return "Bearer " + jwtAuthentication.getToken().getTokenValue();
        }

        return Optional.ofNullable(properties.getTechnicalToken())
                .map(token -> "Bearer " + token)
                .orElseThrow(() -> new IllegalStateException("No authentication token available for Form backend call"));
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
}
