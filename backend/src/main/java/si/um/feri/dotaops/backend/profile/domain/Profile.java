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
        Long opendotaAccountId,
        ProfileRole role,
        String avatarUrl,
        String bio,
        String countryCode,
        OffsetDateTime steamProfileSyncedAt,
        OffsetDateTime opendotaProfileSyncedAt,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {
}
