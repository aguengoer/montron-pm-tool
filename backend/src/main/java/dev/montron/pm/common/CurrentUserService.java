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

@Component
public class CurrentUserService {

    public CurrentUser getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (!(authentication instanceof JwtAuthenticationToken jwtAuthentication)) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User is not authenticated");
        }

        Jwt jwt = jwtAuthentication.getToken();
        UUID userId = extractUuidClaim(jwt, "userId")
                .or(() -> extractUuidClaim(jwt, JwtClaimNames.SUB))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing userId claim"));

        String role = Optional.ofNullable(jwt.getClaimAsString("role"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Missing role claim"));

        UUID companyId = extractUuidClaim(jwt, "companyId")
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.FORBIDDEN, "Missing companyId claim"));

        return new CurrentUser(userId, role, companyId);
    }

    private Optional<UUID> extractUuidClaim(Jwt jwt, String claimName) {
        try {
            return Optional.ofNullable(jwt.getClaimAsString(claimName))
                    .map(String::trim)
                    .filter(s -> !s.isEmpty())
                    .map(UUID::fromString);
        } catch (IllegalArgumentException ex) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Invalid UUID in claim %s".formatted(claimName), ex);
        }
    }
}
