package si.um.feri.dotaops.backend.auth.service;

import java.time.Instant;
import java.util.Date;
import java.util.UUID;

import com.nimbusds.jose.JWSAlgorithm;
import com.nimbusds.jose.JWSHeader;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;

public final class SupabaseJwtTestSupport {

    public static final String SECRET = "01234567890123456789012345678901";
    public static final String ISSUER = "https://test-project.supabase.co/auth/v1";
    public static final String AUDIENCE = "authenticated";

    private SupabaseJwtTestSupport() {
    }

    public static String token(UUID subject, Instant now) throws Exception {
        return token(subject, now, ISSUER, AUDIENCE, SECRET);
    }

    public static String token(
            UUID subject,
            Instant now,
            String issuer,
            String audience,
            String secret
    ) throws Exception {
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .issuer(issuer)
                .audience(audience)
                .subject(subject.toString())
                .claim("email", "player@example.com")
                .claim("role", "authenticated")
                .issueTime(Date.from(now.minusSeconds(30)))
                .expirationTime(Date.from(now.plusSeconds(300)))
                .build();

        SignedJWT jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
        jwt.sign(new MACSigner(secret));
        return jwt.serialize();
    }

    public static String expiredToken(UUID subject, Instant now) throws Exception {
        JWTClaimsSet claims = new JWTClaimsSet.Builder()
                .issuer(ISSUER)
                .audience(AUDIENCE)
                .subject(subject.toString())
                .issueTime(Date.from(now.minusSeconds(600)))
                .expirationTime(Date.from(now.minusSeconds(120)))
                .build();

        SignedJWT jwt = new SignedJWT(new JWSHeader(JWSAlgorithm.HS256), claims);
        jwt.sign(new MACSigner(SECRET));
        return jwt.serialize();
    }
}
