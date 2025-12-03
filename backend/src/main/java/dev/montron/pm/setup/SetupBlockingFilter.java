package dev.montron.pm.setup;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filter that blocks /setup/** endpoints when the installation is already configured.
 * Returns 404 to effectively disable setup endpoints.
 */
@Component
public class SetupBlockingFilter extends OncePerRequestFilter {

    private final SetupStateChecker setupStateChecker;

    public SetupBlockingFilter(SetupStateChecker setupStateChecker) {
        this.setupStateChecker = setupStateChecker;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();

        // Block /setup/** if already configured (except /setup/state which should always be accessible)
        if (path.startsWith("/setup/") && !path.equals("/setup/state")) {
            if (setupStateChecker.isConfigured()) {
                response.setStatus(HttpServletResponse.SC_NOT_FOUND);
                return;
            }
        }

        filterChain.doFilter(request, response);
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        // Only filter /setup/** paths
        String path = request.getRequestURI();
        return !path.startsWith("/setup/");
    }
}

