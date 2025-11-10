package dev.montron.pm.config;

import java.util.List;
import java.util.Locale;
import java.util.Optional;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationConverter;
import org.springframework.security.oauth2.server.resource.web.authentication.BearerTokenAuthenticationFilter;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfigurationSource;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final TenantContextFilter tenantContextFilter;
    private final CorsConfigurationSource corsConfigurationSource;

    public SecurityConfig(TenantContextFilter tenantContextFilter, CorsConfigurationSource corsConfigurationSource) {
        this.tenantContextFilter = tenantContextFilter;
        this.corsConfigurationSource = corsConfigurationSource;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers("/api/ping", "/v3/api-docs/**", "/swagger-ui/**").permitAll()
                        .requestMatchers(org.springframework.http.HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().permitAll())
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(jwt -> jwt
                        .jwtAuthenticationConverter(jwtAuthenticationConverter())));

        // TODO: Configure issuer URI / JWK set URI for JWT validation once available from Montron backend.
        http.addFilterAfter(tenantContextFilter, BearerTokenAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public JwtAuthenticationConverter jwtAuthenticationConverter() {
        JwtAuthenticationConverter converter = new JwtAuthenticationConverter();
        converter.setJwtGrantedAuthoritiesConverter(jwt -> {
            String role = Optional.ofNullable(jwt.getClaimAsString("role"))
                    .map(value -> value.toUpperCase(Locale.ROOT))
                    .orElse(null);

            if (role == null) {
                return List.of();
            }

            return switch (role) {
                case "ADMIN" -> List.<GrantedAuthority>of(new SimpleGrantedAuthority("ROLE_ADMIN"));
                case "EMPLOYEE" -> List.<GrantedAuthority>of(new SimpleGrantedAuthority("ROLE_EMPLOYEE"));
                default -> List.of();
            };
        });
        return converter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public org.springframework.security.oauth2.jwt.JwtDecoder jwtDecoder() {
        // TODO: Replace with real JwtDecoder once Montron auth backend provides JWKS endpoint
        // For now, use a permissive decoder that accepts any JWT without signature verification (DEV ONLY!)
        return token -> {
            try {
                com.nimbusds.jwt.SignedJWT jwt = com.nimbusds.jwt.SignedJWT.parse(token);
                return new org.springframework.security.oauth2.jwt.Jwt(
                    token,
                    jwt.getJWTClaimsSet().getIssueTime() != null ? jwt.getJWTClaimsSet().getIssueTime().toInstant() : java.time.Instant.now(),
                    jwt.getJWTClaimsSet().getExpirationTime() != null ? jwt.getJWTClaimsSet().getExpirationTime().toInstant() : java.time.Instant.now().plusSeconds(3600),
                    jwt.getHeader().toJSONObject(),
                    jwt.getJWTClaimsSet().getClaims()
                );
            } catch (Exception e) {
                throw new org.springframework.security.oauth2.jwt.JwtException("Invalid JWT", e);
            }
        };
    }
}
