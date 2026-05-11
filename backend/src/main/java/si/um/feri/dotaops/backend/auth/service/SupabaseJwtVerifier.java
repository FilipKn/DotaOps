package si.um.feri.dotaops.backend.auth.service;

import java.time.Clock;
import java.time.Instant;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

import javax.crypto.spec.SecretKeySpec;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import si.um.feri.dotaops.backend.auth.domain.SupabaseJwtClaims;
import si.um.feri.dotaops.backend.config.properties.SupabaseAuthProperties;

@Component
public class SupabaseJwtVerifier {

    private final SupabaseAuthProperties properties;
    private final Clock clock;

    @Autowired
    public SupabaseJwtVerifier(SupabaseAuthProperties properties) {
        this(properties, Clock.systemUTC());
    }

    SupabaseJwtVerifier(SupabaseAuthProperties properties, Clock clock) {
        this.properties = properties;
        this.clock = clock;
    }

    public SupabaseJwtClaims verify(String token) {
        Jwt jwt = decode(token);

        validateSubject(jwt);
        validateIssuer(jwt);
        validateAudience(jwt);
        validateTimestamps(jwt);

        return new SupabaseJwtClaims(
                UUID.fromString(jwt.getSubject()),
                jwt.getClaimAsString("email"),
                jwt.getIssuer() == null ? null : jwt.getIssuer().toString(),
                jwt.getAudience(),
                jwt.getExpiresAt(),
                jwt.getIssuedAt(),
                jwt.getClaims());
    }

    private Jwt decode(String token) {
        if (!StringUtils.hasText(properties.jwtSecret())) {
            throw new BadCredentialsException("Supabase JWT secret is not configured.");
        }

        try {
            NimbusJwtDecoder decoder = NimbusJwtDecoder
                    .withSecretKey(new SecretKeySpec(
                            properties.jwtSecret().getBytes(StandardCharsets.UTF_8),
                            "HmacSHA256"))
                    .macAlgorithm(MacAlgorithm.HS256)
                    .build();
            decoder.setJwtValidator(jwt -> OAuth2TokenValidatorResult.success());

            return decoder.decode(token);
        } catch (JwtException | IllegalArgumentException exception) {
            throw new BadCredentialsException("Invalid Supabase access token.", exception);
        }
    }

    private void validateSubject(Jwt jwt) {
        try {
            UUID.fromString(jwt.getSubject());
        } catch (RuntimeException exception) {
            throw new BadCredentialsException("Supabase access token subject must be a user UUID.", exception);
        }
    }

    private void validateIssuer(Jwt jwt) {
        if (!StringUtils.hasText(properties.issuer())) {
            return;
        }

        String actualIssuer = jwt.getIssuer() == null ? null : jwt.getIssuer().toString();
        if (!properties.issuer().equals(actualIssuer)) {
            throw new BadCredentialsException("Supabase access token issuer is invalid.");
        }
    }

    private void validateAudience(Jwt jwt) {
        List<String> audience = jwt.getAudience();

        if (!audience.contains(properties.audience())) {
            throw new BadCredentialsException("Supabase access token audience is invalid.");
        }
    }

    private void validateTimestamps(Jwt jwt) {
        Instant now = clock.instant();
        Instant expiresAt = jwt.getExpiresAt();

        if (expiresAt == null || now.minus(properties.clockSkew()).isAfter(expiresAt)) {
            throw new BadCredentialsException("Supabase access token has expired.");
        }

        Instant notBefore = jwt.getNotBefore();
        if (notBefore != null && now.plus(properties.clockSkew()).isBefore(notBefore)) {
            throw new BadCredentialsException("Supabase access token is not active yet.");
        }
    }
}
