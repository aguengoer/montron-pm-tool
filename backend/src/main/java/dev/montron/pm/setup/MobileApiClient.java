package dev.montron.pm.setup;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.UUID;

/**
 * Client for communicating with the Mobile App backend API.
 * Used during setup to validate service tokens and exchange codes.
 */
@Service
public class MobileApiClient {

    private static final Logger log = LoggerFactory.getLogger(MobileApiClient.class);

    private final WebClient webClient;
    private final String baseUrl;

    public MobileApiClient(
            @Value("${mobile.api.base-url:}") String baseUrl,
            @Value("${mobile.api.timeout-ms:30000}") int timeoutMs,
            WebClient.Builder webClientBuilder) {
        this.baseUrl = baseUrl != null && !baseUrl.isBlank() ? baseUrl : "http://localhost:8090/api";
        this.webClient = webClientBuilder
                .baseUrl(this.baseUrl)
                .defaultHeader(HttpHeaders.CONTENT_TYPE, "application/json")
                .codecs(configurer -> configurer.defaultCodecs().maxInMemorySize(256 * 1024))
                .build();

        log.info("MobileApiClient initialized with baseUrl: {}", this.baseUrl);
    }

    /**
     * Validates a service token and returns company information.
     * 
     * TODO: This endpoint needs to be created in Mobile App backend.
     * Suggested endpoint: GET /api/auth/validate-service-token
     * Headers: Authorization: Bearer {token}
     * Returns: { companyId: UUID, companyName: String }
     * 
     * For now, we use a workaround by calling GET /api/employees with the token
     * and extracting company info from the response or headers.
     */
    public ServiceTokenValidationResponse validateServiceToken(String serviceToken) {
        if (serviceToken == null || serviceToken.isBlank()) {
            throw new IllegalArgumentException("Service token cannot be null or empty");
        }

        // Remove "Bearer " prefix if present
        String token = serviceToken.startsWith("Bearer ") ? serviceToken.substring(7) : serviceToken;
        String bearerToken = "Bearer " + token;

        try {
            // TODO: Replace with dedicated validation endpoint when available:
            // GET /api/auth/validate-service-token
            // For now, validate by calling an authenticated endpoint and extracting company info
            
            // Try to get company info by calling a lightweight endpoint
            // This is a temporary workaround until the validation endpoint is ready
            CompanyInfoResponse companyInfo = webClient.get()
                    .uri("/companies/me") // TODO: This endpoint needs to exist in Mobile App
                    .header(HttpHeaders.AUTHORIZATION, bearerToken)
                    .retrieve()
                    .bodyToMono(CompanyInfoResponse.class)
                    .timeout(Duration.ofMillis(30000))
                    .block();

            if (companyInfo != null && companyInfo.companyId() != null) {
                return new ServiceTokenValidationResponse(
                        companyInfo.companyId(),
                        companyInfo.companyName() != null ? companyInfo.companyName() : "Unknown Company"
                );
            }

            throw new ServiceTokenValidationException("Failed to validate service token: No company information returned");

        } catch (WebClientResponseException.Unauthorized e) {
            log.warn("Service token validation failed: Unauthorized (401)");
            throw new ServiceTokenValidationException("Invalid service token: Authentication failed");
        } catch (WebClientResponseException.NotFound e) {
            log.warn("Service token validation endpoint not found (404). Using fallback method.");
            // Fallback: Try to extract company ID from a different endpoint
            return validateServiceTokenFallback(bearerToken);
        } catch (WebClientResponseException e) {
            log.error("Service token validation failed: HTTP {} - {}", e.getStatusCode(), e.getResponseBodyAsString());
            throw new ServiceTokenValidationException(
                    String.format("Service token validation failed: HTTP %d", e.getStatusCode().value()));
        } catch (Exception e) {
            log.error("Service token validation error", e);
            throw new ServiceTokenValidationException("Service token validation error: " + e.getMessage(), e);
        }
    }

    /**
     * Fallback method: Validate token by calling /employees endpoint and inferring company.
     * This is a workaround until the proper validation endpoint exists.
     */
    private ServiceTokenValidationResponse validateServiceTokenFallback(String bearerToken) {
        try {
            // Call employees endpoint - it should work with service token
            // Extract company from first employee or from response headers
            var response = webClient.get()
                    .uri("/employees?page=0&size=1")
                    .header(HttpHeaders.AUTHORIZATION, bearerToken)
                    .exchangeToMono(clientResponse -> {
                        if (clientResponse.statusCode().is2xxSuccessful()) {
                            // Extract company ID from X-Company-Id header if present
                            String companyIdHeader = clientResponse.headers().asHttpHeaders().getFirst("X-Company-Id");
                            if (companyIdHeader != null) {
                                return Mono.just(new ServiceTokenValidationResponse(
                                        UUID.fromString(companyIdHeader),
                                        "Company"
                                ));
                            }
                            return clientResponse.bodyToMono(Object.class)
                                    .map(body -> {
                                        // TODO: Parse response to extract company ID
                                        // For now, we need the Mobile App to return company info
                                        throw new ServiceTokenValidationException(
                                                "Cannot infer company from response. Please implement validation endpoint.");
                                    });
                        }
                        return Mono.error(new ServiceTokenValidationException(
                                "Token validation failed: " + clientResponse.statusCode()));
                    })
                    .timeout(Duration.ofMillis(30000))
                    .block();

            return (ServiceTokenValidationResponse) response;

        } catch (Exception e) {
            throw new ServiceTokenValidationException(
                    "Service token validation failed: " + e.getMessage(), e);
        }
    }

    /**
     * Exchanges a one-time code for a service token.
     * 
     * TODO: This endpoint needs to be created in Mobile App backend.
     * Suggested endpoint: POST /api/auth/exchange-code
     * Body: { code: string }
     * Returns: { token: string, companyId: UUID, companyName: string }
     */
    public CodeExchangeResponse exchangeCode(String code) {
        // TODO: Implement when Mobile App backend provides the endpoint
        // POST /api/auth/exchange-code
        // Body: { "code": code }
        // Response: { "token": "...", "companyId": "...", "companyName": "..." }
        
        throw new UnsupportedOperationException(
                "Code exchange not yet implemented. The Mobile App backend needs to provide " +
                "POST /api/auth/exchange-code endpoint.");
    }

    public record ServiceTokenValidationResponse(UUID companyId, String companyName) {}
    
    public record CompanyInfoResponse(UUID companyId, String companyName) {}
    
    public record CodeExchangeResponse(String token, UUID companyId, String companyName) {}

    public static class ServiceTokenValidationException extends RuntimeException {
        public ServiceTokenValidationException(String message) {
            super(message);
        }

        public ServiceTokenValidationException(String message, Throwable cause) {
            super(message, cause);
        }
    }
}

