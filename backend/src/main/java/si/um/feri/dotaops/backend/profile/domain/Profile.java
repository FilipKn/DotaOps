package si.um.feri.dotaops.backend.profile.domain;

import java.time.OffsetDateTime;
import java.util.UUID;

import si.um.feri.dotaops.backend.auth.domain.ProfileRole;

public record Profile(
        UUID id,
        UUID authUserId,
        String nickname,
        String displayName,
        String steamId,
        ProfileRole role,
        String avatarUrl,
        String bio,
        String countryCode,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
