package dev.montron.pm.config;

import jakarta.annotation.PostConstruct;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * CORS configuration for local development.
 * IMPORTANT: In production, restrict origins to concrete domains.
 */
@Configuration
public class CorsConfig {

    private static final Logger log = LoggerFactory.getLogger(CorsConfig.class);

    private final List<String> allowedOrigins;

    public CorsConfig(@Value("${security.cors.origins:}") String allowedOrigins) {
        log.info("═══ CorsConfig constructor called with origins: {}", allowedOrigins);
        this.allowedOrigins = Arrays.stream(allowedOrigins.split(","))
                .map(String::trim)
                .filter(origin -> !origin.isEmpty())
                .collect(Collectors.toList());
        log.info("═══ Parsed {} origins: {}", this.allowedOrigins.size(), this.allowedOrigins);
    }

    @PostConstruct
    void logAllowedOrigins() {
        log.info("═══ CORS @PostConstruct: allowed origins: {}", allowedOrigins);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();

        List<String> effectiveOrigins = this.allowedOrigins;
        if (effectiveOrigins == null || effectiveOrigins.isEmpty()) {
            log.warn("No security.cors.origins configured, falling back to localhost defaults for development");
            effectiveOrigins = Arrays.asList("http://localhost:3000", "http://localhost:3001");
        }

        configuration.setAllowedOriginPatterns(effectiveOrigins);
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(Arrays.asList("Content-Disposition"));
        configuration.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
