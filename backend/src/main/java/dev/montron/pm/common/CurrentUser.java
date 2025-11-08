package dev.montron.pm.common;

import java.util.UUID;

/**
 * Represents the authenticated Montron PM user extracted from JWT claims.
 */
public record CurrentUser(UUID userId, String role, UUID companyId) {}
