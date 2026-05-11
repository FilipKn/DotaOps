package si.um.feri.dotaops.backend.config.properties;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "dotaops.supabase.auth")
public record SupabaseAuthProperties(
        String jwtSecret,
        String issuer,
        String audience,
        Duration clockSkew
) {

    public SupabaseAuthProperties {
        audience = audience == null || audience.isBlank() ? "authenticated" : audience;
        clockSkew = clockSkew == null ? Duration.ofSeconds(30) : clockSkew;
    }
}
