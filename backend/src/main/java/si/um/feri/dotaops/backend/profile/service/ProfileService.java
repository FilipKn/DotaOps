package si.um.feri.dotaops.backend.profile.service;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import si.um.feri.dotaops.backend.auth.domain.AuthenticatedProfile;
import si.um.feri.dotaops.backend.auth.service.CurrentUserProvider;
import si.um.feri.dotaops.backend.common.error.BadRequestException;
import si.um.feri.dotaops.backend.common.error.ResourceNotFoundException;
import si.um.feri.dotaops.backend.common.pagination.PageResponse;
import si.um.feri.dotaops.backend.profile.domain.Profile;
import si.um.feri.dotaops.backend.profile.repository.CreateProfileCommand;
import si.um.feri.dotaops.backend.profile.repository.ProfileRepository;
import si.um.feri.dotaops.backend.profile.repository.UpdateProfileCommand;
import si.um.feri.dotaops.backend.profile.web.CreateProfileRequest;
import si.um.feri.dotaops.backend.profile.web.ProfileResponse;
import si.um.feri.dotaops.backend.profile.web.UpdateProfileRequest;

@Service
public class ProfileService {

    private final ProfileRepository profileRepository;
    private final CurrentUserProvider currentUserProvider;

    public ProfileService(
            ProfileRepository profileRepository,
            CurrentUserProvider currentUserProvider
    ) {
        this.profileRepository = profileRepository;
        this.currentUserProvider = currentUserProvider;
    }

    @Transactional(readOnly = true)
    public PageResponse<ProfileResponse> listProfiles(String search, int page, int size) {
        int safePage = Math.max(page, 0);
        int safeSize = Math.min(Math.max(size, 1), 100);
        long offset = (long) safePage * safeSize;

        List<ProfileResponse> profiles = profileRepository.findProfiles(search, safeSize, offset)
                .stream()
                .map(ProfileResponse::from)
                .toList();
        long total = profileRepository.countProfiles(search);

        return PageResponse.from(new PageImpl<>(
                profiles,
                PageRequest.of(safePage, safeSize),
                total));
    }

    @Transactional(readOnly = true)
    public ProfileResponse getProfile(UUID profileId) {
        return profileRepository.findById(profileId)
                .map(ProfileResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Profile", "id", profileId));
    }

    @Transactional(readOnly = true)
    public ProfileResponse getProfileByNickname(String nickname) {
        String normalizedNickname = normalizeRequired(nickname);

        return profileRepository.findByNickname(normalizedNickname)
                .map(ProfileResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Profile", "nickname", normalizedNickname));
    }

    @Transactional(readOnly = true)
    public ProfileResponse getCurrentProfile() {
        AuthenticatedProfile currentProfile = currentUserProvider.requireProfile();

        return profileRepository.findById(currentProfile.profileId())
                .map(ProfileResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Profile", "id", currentProfile.profileId()));
    }

    @Transactional
    public ProfileResponse createCurrentProfile(CreateProfileRequest request) {
        UUID authUserId = currentUserProvider.requireAuthUserId();

        if (profileRepository.findByAuthUserId(authUserId).isPresent()) {
            throw new BadRequestException("Authenticated user already has a profile.");
        }

        Profile profile = profileRepository.create(new CreateProfileCommand(
                authUserId,
                normalizeRequired(request.nickname()),
                normalizeOptional(request.displayName()),
                normalizeOptional(request.avatarUrl()),
                normalizeOptional(request.bio()),
                normalizeCountryCode(request.countryCode())));

        return ProfileResponse.from(profile);
    }

    @Transactional
    public ProfileResponse updateCurrentProfile(UpdateProfileRequest request) {
        if (!request.hasChanges()) {
            throw new BadRequestException("At least one profile field must be provided.");
        }

        UUID profileId = currentUserProvider.requireProfileId();

        return profileRepository.updateById(
                        profileId,
                        new UpdateProfileCommand(
                                request.hasNickname(),
                                request.hasNickname() ? normalizeRequired(request.nickname()) : null,
                                request.hasDisplayName(),
                                request.hasDisplayName() ? normalizeOptional(request.displayName()) : null,
                                request.hasAvatarUrl(),
                                request.hasAvatarUrl() ? normalizeOptional(request.avatarUrl()) : null,
                                request.hasBio(),
                                request.hasBio() ? normalizeOptional(request.bio()) : null,
                                request.hasCountryCode(),
                                request.hasCountryCode() ? normalizeCountryCode(request.countryCode()) : null))
                .map(ProfileResponse::from)
                .orElseThrow(() -> new ResourceNotFoundException("Profile", "id", profileId));
    }

    private String normalizeRequired(String value) {
        if (value == null || value.isBlank()) {
            throw new BadRequestException("Required profile field is blank.");
        }

        return value.trim();
    }

    private String normalizeOptional(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        return value.trim();
    }

    private String normalizeCountryCode(String value) {
        String normalized = normalizeOptional(value);

        if (normalized == null) {
            return null;
        }

        return normalized.toUpperCase(Locale.ROOT);
    }
}
