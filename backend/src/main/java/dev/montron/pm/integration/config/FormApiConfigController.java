package dev.montron.pm.integration.config;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Optional;

@RestController
@RequestMapping("/api/config/form-api")
@Tag(name = "Form API Configuration", description = "Manage Form API service token and base URL configuration")
@SecurityRequirement(name = "bearerAuth")
@PreAuthorize("hasRole('ADMIN')")
public class FormApiConfigController {

    private final FormApiConfigService configService;

    public FormApiConfigController(FormApiConfigService configService) {
        this.configService = configService;
    }

    @GetMapping
    @Operation(summary = "Get Form API configuration", description = "Get the current company's Form API configuration")
    public ResponseEntity<FormApiConfigResponse> getConfig() {
        Optional<FormApiConfigService.FormApiConfigDto> config = configService.getConfig();
        
        if (config.isEmpty()) {
            return ResponseEntity.ok(new FormApiConfigResponse(null, null, false));
        }

        FormApiConfigService.FormApiConfigDto dto = config.get();
        return ResponseEntity.ok(new FormApiConfigResponse(
                dto.baseUrl(),
                null, // Never return the actual token for security
                dto.serviceToken() != null && !dto.serviceToken().isBlank()
        ));
    }

    @PutMapping
    @Operation(summary = "Update Form API configuration", description = "Update the service token and base URL for the current company")
    public ResponseEntity<FormApiConfigResponse> updateConfig(@Valid @RequestBody UpdateFormApiConfigRequest request) {
        configService.saveConfig(request.baseUrl(), request.serviceToken());
        
        Optional<FormApiConfigService.FormApiConfigDto> updated = configService.getConfig();
        boolean hasToken = updated.map(dto -> dto.serviceToken() != null && !dto.serviceToken().isBlank())
                .orElse(false);

        return ResponseEntity.ok(new FormApiConfigResponse(
                request.baseUrl(),
                null, // Never return the actual token
                hasToken
        ));
    }

    public record UpdateFormApiConfigRequest(
            String baseUrl,
            @NotBlank(message = "Service token is required")
            String serviceToken
    ) {}

    public record FormApiConfigResponse(
            String baseUrl,
            String serviceToken, // Always null in response for security
            boolean serviceTokenConfigured
    ) {}
}

