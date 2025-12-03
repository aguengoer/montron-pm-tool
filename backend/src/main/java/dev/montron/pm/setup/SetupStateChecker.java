package dev.montron.pm.setup;

import org.springframework.stereotype.Component;

/**
 * Helper component to check installation state.
 * Used by SecurityConfig to gate endpoints.
 */
@Component
public class SetupStateChecker {

    private final SetupService setupService;

    public SetupStateChecker(SetupService setupService) {
        this.setupService = setupService;
    }

    /**
     * Check if the installation is configured.
     * This method is safe to call during security configuration.
     */
    public boolean isConfigured() {
        try {
            return setupService.isConfigured();
        } catch (Exception e) {
            // If we can't determine state (e.g., DB not initialized), assume unconfigured
            return false;
        }
    }
}

