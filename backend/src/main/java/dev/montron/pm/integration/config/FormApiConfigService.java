package dev.montron.pm.integration.config;

import dev.montron.pm.common.CurrentUser;
import dev.montron.pm.common.CurrentUserService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;
import java.util.UUID;

/**
 * Service for managing Form API configuration (service token and base URL) per company.
 */
@Service
public class FormApiConfigService {

    private static final Logger log = LoggerFactory.getLogger(FormApiConfigService.class);

    private final FormApiConfigRepository repository;
    private final TokenEncryptionService encryptionService;
    private final CurrentUserService currentUserService;

    public FormApiConfigService(
            FormApiConfigRepository repository,
            TokenEncryptionService encryptionService,
            CurrentUserService currentUserService) {
        this.repository = repository;
        this.encryptionService = encryptionService;
        this.currentUserService = currentUserService;
    }

    /**
     * Get the current company's Form API configuration.
     */
    @Transactional(readOnly = true)
    public Optional<FormApiConfigDto> getConfig() {
        CurrentUser currentUser = currentUserService.getCurrentUser();
        UUID companyId = currentUser.companyId();

        return repository.findByCompanyId(companyId)
                .map(entity -> {
                    String decryptedToken = encryptionService.decrypt(entity.getServiceTokenEncrypted());
                    return new FormApiConfigDto(
                            entity.getFormApiBaseUrl(),
                            decryptedToken
                    );
                });
    }

    /**
     * Get the decrypted service token for the current company.
     * Returns empty if not configured.
     */
    @Transactional(readOnly = true)
    public Optional<String> getServiceToken() {
        return getConfig().map(FormApiConfigDto::serviceToken);
    }

    /**
     * Get the base URL for the current company.
     * Returns empty if not configured.
     */
    @Transactional(readOnly = true)
    public Optional<String> getBaseUrl() {
        return getConfig().map(FormApiConfigDto::baseUrl);
    }

    /**
     * Save or update the Form API configuration for the current company.
     * @param baseUrl Base URL (can be null to not update)
     * @param serviceToken Service token (can be null/empty to keep existing)
     */
    @Transactional
    public void saveConfig(String baseUrl, String serviceToken) {
        CurrentUser currentUser = currentUserService.getCurrentUser();
        UUID companyId = currentUser.companyId();

        FormApiConfigEntity entity = repository.findByCompanyId(companyId)
                .orElse(new FormApiConfigEntity());

        entity.setCompanyId(companyId);
        
        // Update baseUrl if provided
        if (baseUrl != null) {
            entity.setFormApiBaseUrl(baseUrl);
        }
        
        // Update service token only if provided (non-empty)
        if (serviceToken != null && !serviceToken.isBlank()) {
            // Remove "Bearer " prefix if present
            String token = serviceToken.startsWith("Bearer ") 
                    ? serviceToken.substring(7) 
                    : serviceToken;
            String encrypted = encryptionService.encrypt(token);
            entity.setServiceTokenEncrypted(encrypted);
        } else if (entity.getId() == null) {
            // New entity requires a token
            throw new IllegalArgumentException("Service token is required when creating new configuration");
        }
        // Otherwise, keep existing encrypted token

        repository.save(entity);
        log.info("Saved Form API config for company: {}", companyId);
    }

    public record FormApiConfigDto(String baseUrl, String serviceToken) {}
}

