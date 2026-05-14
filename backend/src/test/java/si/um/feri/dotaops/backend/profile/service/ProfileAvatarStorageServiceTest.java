package si.um.feri.dotaops.backend.profile.service;

import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.mock.web.MockMultipartFile;

import si.um.feri.dotaops.backend.common.error.BadRequestException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ProfileAvatarStorageServiceTest {

    private static final UUID PROFILE_ID = UUID.fromString("22222222-2222-4222-8222-222222222222");

    @TempDir
    private Path uploadDirectory;

    @Test
    void storePersistsImageWithStableProfileFilename() {
        ProfileAvatarStorageService service = new ProfileAvatarStorageService(uploadDirectory.toString());
        MockMultipartFile avatar = new MockMultipartFile(
                "avatar",
                "avatar.png",
                "image/png",
                new byte[] {1, 2, 3});

        StoredProfileAvatar stored = service.store(PROFILE_ID, avatar);

        assertThat(stored.filename()).isEqualTo(PROFILE_ID + ".png");
        assertThat(stored.contentType()).isEqualTo("image/png");
        assertThat(Files.exists(uploadDirectory.resolve(PROFILE_ID + ".png"))).isTrue();
    }

    @Test
    void storeRejectsUnsupportedImageType() {
        ProfileAvatarStorageService service = new ProfileAvatarStorageService(uploadDirectory.toString());
        MockMultipartFile avatar = new MockMultipartFile(
                "avatar",
                "avatar.svg",
                "image/svg+xml",
                "<svg />".getBytes());

        assertThatThrownBy(() -> service.store(PROFILE_ID, avatar))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Avatar must be a png, jpeg, webp or gif image.");
    }

    @Test
    void loadRejectsTraversalLikeFilename() {
        ProfileAvatarStorageService service = new ProfileAvatarStorageService(uploadDirectory.toString());

        assertThatThrownBy(() -> service.load("../avatar.png"))
                .hasMessageContaining("Profile avatar not found");
    }
}
