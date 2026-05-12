package si.um.feri.dotaops.backend.profile.web;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @Size(min = 2, max = 40)
        String nickname,

        @Size(max = 80)
        String displayName,

        @Size(max = 512)
        String avatarUrl,

        @Size(max = 500)
        String bio,

        @Pattern(regexp = "^[A-Za-z]{2}$")
        String countryCode
) {

    public boolean hasChanges() {
        return nickname != null
                || displayName != null
                || avatarUrl != null
                || bio != null
                || countryCode != null;
    }
}
