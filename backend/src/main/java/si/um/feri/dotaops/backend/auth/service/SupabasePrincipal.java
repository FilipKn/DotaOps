package si.um.feri.dotaops.backend.auth.service;

import java.util.Optional;
import java.util.UUID;

import si.um.feri.dotaops.backend.auth.domain.AuthenticatedProfile;
import si.um.feri.dotaops.backend.auth.domain.ProfileRole;
import si.um.feri.dotaops.backend.auth.domain.SupabaseJwtClaims;

public record SupabasePrincipal(
        UUID authUserId,
        String email,
        Optional<AuthenticatedProfile> profile,
        SupabaseJwtClaims token
) {

    public SupabasePrincipal {
        profile = profile == null ? Optional.empty() : profile;
    }

    public ProfileRole role() {
        return profile.map(AuthenticatedProfile::role).orElse(ProfileRole.VISITOR);
    }
}
