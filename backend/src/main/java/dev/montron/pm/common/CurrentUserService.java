package dev.montron.pm.common;

import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtClaimNames;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.beans.factory.annotation.Value;
import dev.montron.pm.employees.EmployeeRepository;

@Component
public class CurrentUserService {

    private final EmployeeRepository employeeRepository;
    private final UUID devDefaultCompanyId;

    public CurrentUserService(EmployeeRepository employeeRepository,
                              @Value("${security.dev.company-id:}") String devDefaultCompanyId) {
        this.employeeRepository = employeeRepository;
        this.devDefaultCompanyId = parseUuidOrNull(devDefaultCompanyId);
    }

    public CurrentUser getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!(authentication instanceof JwtAuthenticationToken jwtAuthentication)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
        }

        Jwt jwt = jwtAuthentication.getToken();
        
        // DEBUG: Log all JWT claims to see what's actually in the token
        System.err.println("=== JWT Claims Debug ===");
        jwt.getClaims().forEach((key, value) -> {
            System.err.println(key + ": " + value + " (type: " + (value != null ? value.getClass().getSimpleName() : "null") + ")");
        });
        System.err.println("========================");
        
        UUID userId = extractUuidClaim(jwt, "userId")
                .or(() -> extractUuidClaim(jwt, "uid"))
                .or(() -> extractUuidClaim(jwt, "id"))
                .or(() -> extractUuidClaim(jwt, "user_id"))
                .or(() -> extractUuidClaim(jwt, JwtClaimNames.SUB))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing userId claim (tried: userId, uid, id, user_id, sub)"));

        String role = Optional.ofNullable(jwt.getClaimAsString("role"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Missing role claim"));

        UUID companyId = extractUuidClaim(jwt, "companyId")
                .or(() -> extractUuidClaim(jwt, "company_id"))
                .or(() -> extractUuidClaim(jwt, "cid"))
                .or(() -> extractUuidClaim(jwt, "tenantId"))
                .or(() -> extractUuidClaim(jwt, "tenant"))
                .orElse(null);

        if (companyId == null) {
            // Fallback: resolve companyId from the employee record by user id
            companyId = employeeRepository.findById(userId)
                    .map(e -> e.getCompanyId())
                    .orElse(null);
        }

        if (companyId == null) {
            // Secondary fallback: resolve by username in 'sub'
            String sub = jwt.getClaimAsString("sub");
            if (sub != null && !sub.isBlank()) {
                companyId = employeeRepository.findByUsername(sub.trim())
                        .map(e -> e.getCompanyId())
                        .orElse(null);
            }
        }

        if (companyId == null) {
            // Dev fallback via configuration
            if (devDefaultCompanyId != null) {
                companyId = devDefaultCompanyId;
            } else {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Missing companyId claim (tried: companyId, company_id, cid, tenantId, tenant) and unable to infer from user");
            }
        }

        return new CurrentUser(userId, role, companyId);
    }

    private Optional<UUID> extractUuidClaim(Jwt jwt, String claimName) {
        try {
            return Optional.ofNullable(jwt.getClaimAsString(claimName))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(UUID::fromString);
        } catch (IllegalArgumentException ex) {
            // Claim exists but is not a valid UUID (e.g. username in 'sub'), return empty to try next claim
            return Optional.empty();
        }
    }

    private UUID parseUuidOrNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return UUID.fromString(value.trim());
        } catch (IllegalArgumentException ex) {
            return null;
        }
    }
}
