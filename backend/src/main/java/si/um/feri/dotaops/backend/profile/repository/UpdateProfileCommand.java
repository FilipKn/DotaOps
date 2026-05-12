package si.um.feri.dotaops.backend.profile.repository;

public record UpdateProfileCommand(
        String nickname,
        String displayName,
        String avatarUrl,
        String bio,
        String countryCode
) {
}
