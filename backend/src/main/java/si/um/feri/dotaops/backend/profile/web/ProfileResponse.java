package si.um.feri.dotaops.backend.profile.web;

import java.time.OffsetDateTime;
import java.util.UUID;

import si.um.feri.dotaops.backend.profile.domain.Profile;

public record ProfileResponse(
        UUID id,
        String nickname,
        String displayName,
        String steamId,
        String role,
        String avatarUrl,
        String bio,
        String countryCode,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {

    public static ProfileResponse from(Profile profile) {
        return new ProfileResponse(
                profile.id(),
                profile.nickname(),
                profile.displayName(),
                profile.steamId(),
                profile.role().databaseValue(),
                profile.avatarUrl(),
                profile.bio(),
                profile.countryCode(),
                profile.createdAt(),
                profile.updatedAt());
    }
}
