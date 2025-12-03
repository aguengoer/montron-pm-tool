package dev.montron.pm.setup;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

/**
 * Controller for the setup wizard endpoints.
 * These endpoints are only accessible when the installation is UNCONFIGURED.
 */
@RestController
@RequestMapping("/setup")
public class SetupController {

    private static final Logger log = LoggerFactory.getLogger(SetupController.class);

    private final SetupService setupService;
    private final String bootstrapSecret;

    public SetupController(
            SetupService setupService,
            @Value("${pm.bootstrap-secret:}") String bootstrapSecret) {
        this.setupService = setupService;
        this.bootstrapSecret = bootstrapSecret;
    }

    /**
     * Get the current installation state.
     * This endpoint is public and always accessible.
     */
    @GetMapping("/state")
    public ResponseEntity<SetupStateResponse> getState() {
        InstallationState state = setupService.getInstallationState();
        return ResponseEntity.ok(new SetupStateResponse(state.getState()));
    }

    /**
     * Configure the installation with a service token.
     * Only accessible when UNCONFIGURED.
     */
    @PostMapping("/token")
    public ResponseEntity<?> configureWithToken(
            @Valid @RequestBody ConfigureWithTokenRequest request,
            HttpServletRequest httpRequest) {
        
        // Check if already configured
        if (setupService.isConfigured()) {
            log.warn("Attempt to configure already configured installation from IP: {}", 
                    getClientIp(httpRequest));
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        // Optional: Check bootstrap secret if configured
        if (bootstrapSecret != null && !bootstrapSecret.isBlank()) {
            String providedSecret = httpRequest.getHeader("X-Setup-Secret");
            if (!bootstrapSecret.equals(providedSecret)) {
                log.warn("Invalid bootstrap secret provided from IP: {}", getClientIp(httpRequest));
                return ResponseEntity.status(HttpStatus.FORBIDDEN)
                        .body(new ErrorResponse("Invalid setup secret"));
            }
        }

        try {
            setupService.configureWithServiceToken(request.serviceToken(), httpRequest);
            return ResponseEntity.ok(new ConfigureResponse(true, "Installation configured successfully"));
        } catch (IllegalArgumentException e) {
            log.warn("Invalid service token provided: {}", e.getMessage());
            return ResponseEntity.badRequest()
                    .body(new ErrorResponse(e.getMessage()));
        } catch (IllegalStateException e) {
            log.warn("Configuration failed: {}", e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body(new ErrorResponse(e.getMessage()));
        } catch (Exception e) {
            log.error("Unexpected error during configuration", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(new ErrorResponse("Configuration failed: " + e.getMessage()));
        }
    }

    /**
     * Configure the installation with a one-time code.
     * Stub for future implementation.
     */
    @PostMapping("/code")
    public ResponseEntity<?> configureWithCode(
            @Valid @RequestBody ConfigureWithCodeRequest request,
            HttpServletRequest httpRequest) {
        
        // Check if already configured
        if (setupService.isConfigured()) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
        }

        // TODO: Implement code exchange when Mobile App backend provides the endpoint
        // For now, return 501 Not Implemented
        return ResponseEntity.status(HttpStatus.NOT_IMPLEMENTED)
                .body(new ErrorResponse("Code exchange is not yet implemented. Use service token instead."));
    }

    private String getClientIp(HttpServletRequest request) {
        String xForwardedFor = request.getHeader("X-Forwarded-For");
        if (xForwardedFor != null && !xForwardedFor.isEmpty()) {
            return xForwardedFor.split(",")[0].trim();
        }
        String xRealIp = request.getHeader("X-Real-IP");
        if (xRealIp != null && !xRealIp.isEmpty()) {
            return xRealIp;
        }
        return request.getRemoteAddr();
    }

    // Request/Response DTOs
    public record SetupStateResponse(String state) {}

    public record ConfigureWithTokenRequest(
            @NotBlank(message = "Service token is required")
            String serviceToken
    ) {}

    public record ConfigureWithCodeRequest(
            @NotBlank(message = "Code is required")
            String code
    ) {}

    public record ConfigureResponse(boolean success, String message) {}

    public record ErrorResponse(String message) {}
}

