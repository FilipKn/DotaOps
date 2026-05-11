package si.um.feri.dotaops.backend.auth.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.security.authentication.BadCredentialsException;

import si.um.feri.dotaops.backend.auth.domain.SupabaseJwtClaims;
import si.um.feri.dotaops.backend.config.properties.SupabaseAuthProperties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SupabaseJwtVerifierTest {

    private static final Instant NOW = Instant.parse("2026-05-11T18:00:00Z");
    private static final UUID AUTH_USER_ID = UUID.fromString("33333333-3333-4333-8333-333333333333");

    private final SupabaseJwtVerifier verifier = new SupabaseJwtVerifier(
            new SupabaseAuthProperties(
                    SupabaseJwtTestSupport.SECRET,
                    SupabaseJwtTestSupport.ISSUER,
                    SupabaseJwtTestSupport.AUDIENCE,
                    Duration.ofSeconds(30)),
            Clock.fixed(NOW, ZoneOffset.UTC));

    @Test
    void verifiesSignedTokenAndExtractsCoreClaims() throws Exception {
        SupabaseJwtClaims claims = verifier.verify(SupabaseJwtTestSupport.token(AUTH_USER_ID, NOW));

        assertThat(claims.authUserId()).isEqualTo(AUTH_USER_ID);
        assertThat(claims.issuer()).isEqualTo(SupabaseJwtTestSupport.ISSUER);
        assertThat(claims.audience()).contains(SupabaseJwtTestSupport.AUDIENCE);
        assertThat(claims.email()).isEqualTo("player@example.com");
    }

    @Test
    void rejectsWrongAudience() throws Exception {
        String token = SupabaseJwtTestSupport.token(
                AUTH_USER_ID,
                NOW,
                SupabaseJwtTestSupport.ISSUER,
                "anon",
                SupabaseJwtTestSupport.SECRET);

        assertThatThrownBy(() -> verifier.verify(token))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("audience");
    }

    @Test
    void rejectsExpiredToken() throws Exception {
        assertThatThrownBy(() -> verifier.verify(SupabaseJwtTestSupport.expiredToken(AUTH_USER_ID, NOW)))
                .isInstanceOf(BadCredentialsException.class)
                .hasMessageContaining("expired");
    }
}
