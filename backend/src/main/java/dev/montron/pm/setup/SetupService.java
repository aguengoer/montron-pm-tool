package dev.montron.pm.setup;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.crypto.encrypt.TextEncryptor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

/**
 * Service for managing the setup wizard state and mobile backend linking.
 */
@Service
public class SetupService {

    private static final Logger log = LoggerFactory.getLogger(SetupService.class);

    private final InstallationStateRepository stateRepository;
    private final MobileLinkRepository mobileLinkRepository;
    private final MobileApiClient mobileApiClient;
    private final TextEncryptor textEncryptor;

    public SetupService(
            InstallationStateRepository stateRepository,
            MobileLinkRepository mobileLinkRepository,
            MobileApiClient mobileApiClient,
            TextEncryptor textEncryptor) {
        this.stateRepository = stateRepository;
        this.mobileLinkRepository = mobileLinkRepository;
        this.mobileApiClient = mobileApiClient;
        this.textEncryptor = textEncryptor;
    }

    /**
     * Get the current installation state.
     */
    @Transactional(readOnly = true)
    public InstallationState getInstallationState() {
        return stateRepository.findById("INSTALLATION_STATE")
                .orElseGet(() -> {
                    // Create default state if not exists
                    InstallationState state = new InstallationState();
                    state.setId("INSTALLATION_STATE");
                    state.setState("UNCONFIGURED");
                    return state;
                });
    }

    /**
     * Check if the installation is configured.
     */
    @Transactional(readOnly = true)
    public boolean isConfigured() {
        InstallationState state = getInstallationState();
        return state.isConfigured();
    }

    /**
     * Configure the installation with a service token.
     */
    @Transactional
    public void configureWithServiceToken(String serviceToken, HttpServletRequest request) {
        // Check if already configured
        InstallationState state = getInstallationState();
        if (state.isConfigured()) {
            throw new IllegalStateException("Installation is already configured");
        }

        // Validate token with Mobile API
        MobileApiClient.ServiceTokenValidationResponse validation;
        try {
            validation = mobileApiClient.validateServiceToken(serviceToken);
        } catch (MobileApiClient.ServiceTokenValidationException e) {
            log.error("Service token validation failed", e);
            throw new IllegalArgumentException("Invalid service token: " + e.getMessage());
        }

        UUID companyId = validation.companyId();
        String companyName = validation.companyName();

        // Check if link already exists
        if (mobileLinkRepository.existsByMobileCompanyId(companyId)) {
            throw new IllegalStateException(
                    String.format("Mobile backend link already exists for company: %s", companyName));
        }

        // Encrypt and store the token
        String encryptedToken = textEncryptor.encrypt(serviceToken);

        MobileLink mobileLink = new MobileLink();
        mobileLink.setMobileCompanyId(companyId);
        mobileLink.setCompanyName(companyName);
        mobileLink.setServiceTokenEnc(encryptedToken);
        mobileLinkRepository.save(mobileLink);

        // Update installation state
        state.setState("CONFIGURED");
        state.setConfiguredAt(Instant.now());
        state.setConfiguredByIp(getClientIp(request));
        state.setConfiguredByUserAgent(request.getHeader("User-Agent"));
        stateRepository.save(state);

        log.info("Installation configured successfully. Company: {} (ID: {})", companyName, companyId);
    }

    /**
     * Configure the installation with a one-time code (stub for future implementation).
     */
    @Transactional
    public void configureWithCode(String code, HttpServletRequest request) {
        // TODO: Implement code exchange flow
        // For now, return 501 Not Implemented
        throw new UnsupportedOperationException(
                "Code exchange is not yet implemented. Use service token instead.");
    }

    /**
     * Get the mobile link if configured.
     */
    @Transactional(readOnly = true)
    public Optional<MobileLink> getMobileLink() {
        if (!isConfigured()) {
            return Optional.empty();
        }
        return mobileLinkRepository.findAll().stream().findFirst();
    }

    /**
     * Get the decrypted service token for the configured mobile link.
     */
    @Transactional(readOnly = true)
    public Optional<String> getServiceToken() {
        return getMobileLink()
                .map(link -> textEncryptor.decrypt(link.getServiceTokenEnc()));
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
}

