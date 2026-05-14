package si.um.feri.dotaops.backend.profile.service;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import si.um.feri.dotaops.backend.common.error.BadRequestException;
import si.um.feri.dotaops.backend.common.error.ResourceNotFoundException;

@Service
public class ProfileAvatarStorageService {

    private static final long MAX_AVATAR_BYTES = 5L * 1024L * 1024L;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/gif",
            "image/jpeg",
            "image/png",
            "image/webp");

    private final Path uploadDirectory;

    public ProfileAvatarStorageService(
            @Value("${dotaops.profile.avatar.upload-dir:.local/profile-avatars}") String uploadDirectory
    ) {
        this.uploadDirectory = Path.of(uploadDirectory).toAbsolutePath().normalize();
    }

    public StoredProfileAvatar store(UUID profileId, MultipartFile avatar) {
        if (avatar == null || avatar.isEmpty()) {
            throw new BadRequestException("Avatar file is required.");
        }

        if (avatar.getSize() > MAX_AVATAR_BYTES) {
            throw new BadRequestException("Avatar image must be 5MB or smaller.");
        }

        String contentType = normalizeContentType(avatar.getContentType());
        if (!ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new BadRequestException("Avatar must be a png, jpeg, webp or gif image.");
        }

        String filename = profileId + extensionFor(contentType);
        Path target = uploadDirectory.resolve(filename).normalize();
        if (!target.startsWith(uploadDirectory)) {
            throw new BadRequestException("Avatar filename is invalid.");
        }

        try {
            Files.createDirectories(uploadDirectory);
            deletePreviousAvatarFiles(profileId);
            try (InputStream inputStream = avatar.getInputStream()) {
                Files.copy(inputStream, target, StandardCopyOption.REPLACE_EXISTING);
            }
        } catch (IOException exception) {
            throw new BadRequestException("Avatar file could not be stored.");
        }

        return new StoredProfileAvatar(filename, contentType);
    }

    public Resource load(String filename) {
        if (!StringUtils.hasText(filename) || !filename.matches("^[0-9a-fA-F-]{36}\\.(png|jpg|webp|gif)$")) {
            throw new ResourceNotFoundException("Profile avatar", "filename", filename);
        }

        Path file = uploadDirectory.resolve(filename).normalize();
        if (!file.startsWith(uploadDirectory) || !Files.isRegularFile(file)) {
            throw new ResourceNotFoundException("Profile avatar", "filename", filename);
        }

        try {
            Resource resource = new UrlResource(file.toUri());
            if (resource.exists() && resource.isReadable()) {
                return resource;
            }
        } catch (IOException exception) {
            throw new ResourceNotFoundException("Profile avatar", "filename", filename);
        }

        throw new ResourceNotFoundException("Profile avatar", "filename", filename);
    }

    public String contentTypeFor(String filename) {
        if (filename == null) {
            return "application/octet-stream";
        }

        String lower = filename.toLowerCase(Locale.ROOT);
        if (lower.endsWith(".png")) {
            return "image/png";
        }
        if (lower.endsWith(".jpg")) {
            return "image/jpeg";
        }
        if (lower.endsWith(".webp")) {
            return "image/webp";
        }
        if (lower.endsWith(".gif")) {
            return "image/gif";
        }

        return "application/octet-stream";
    }

    private void deletePreviousAvatarFiles(UUID profileId) throws IOException {
        if (!Files.isDirectory(uploadDirectory)) {
            return;
        }

        try (var files = Files.list(uploadDirectory)) {
            files.filter(path -> path.getFileName().toString().startsWith(profileId.toString() + "."))
                    .forEach(this::deleteQuietly);
        }
    }

    private void deleteQuietly(Path path) {
        try {
            Files.deleteIfExists(path);
        } catch (IOException ignored) {
            // A stale avatar file must not block replacing the profile avatar.
        }
    }

    private String normalizeContentType(String contentType) {
        if (!StringUtils.hasText(contentType)) {
            throw new BadRequestException("Avatar content type is required.");
        }

        return contentType.trim().toLowerCase(Locale.ROOT);
    }

    private String extensionFor(String contentType) {
        return switch (contentType) {
            case "image/png" -> ".png";
            case "image/jpeg" -> ".jpg";
            case "image/webp" -> ".webp";
            case "image/gif" -> ".gif";
            default -> throw new BadRequestException("Avatar content type is not supported.");
        };
    }
}
