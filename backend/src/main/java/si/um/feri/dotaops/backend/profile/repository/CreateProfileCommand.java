package si.um.feri.dotaops.backend.profile.repository;

import java.util.UUID;

public record CreateProfileCommand(
        UUID authUserId,
        String nickname,
        String displayName,
        String avatarUrl,
        String bio,
        String countryCode
) {
}
