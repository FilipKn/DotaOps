package si.um.feri.dotaops.backend.profile.service;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import si.um.feri.dotaops.backend.auth.domain.AuthenticatedProfile;
import si.um.feri.dotaops.backend.auth.domain.ProfileRole;
import si.um.feri.dotaops.backend.auth.service.CurrentUserProvider;
import si.um.feri.dotaops.backend.common.error.BadRequestException;
import si.um.feri.dotaops.backend.profile.domain.Profile;
import si.um.feri.dotaops.backend.profile.repository.CreateProfileCommand;
import si.um.feri.dotaops.backend.profile.repository.ProfileRepository;
import si.um.feri.dotaops.backend.profile.repository.UpdateProfileCommand;
import si.um.feri.dotaops.backend.profile.web.CreateProfileRequest;
import si.um.feri.dotaops.backend.profile.web.UpdateProfileRequest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class ProfileServiceTest {

    private static final UUID AUTH_USER_ID = UUID.fromString("11111111-1111-4111-8111-111111111111");
    private static final UUID PROFILE_ID = UUID.fromString("22222222-2222-4222-8222-222222222222");

    private final ProfileRepository profileRepository = mock(ProfileRepository.class);
    private final CurrentUserProvider currentUserProvider = mock(CurrentUserProvider.class);
    private final ProfileService profileService = new ProfileService(profileRepository, currentUserProvider);

    @Test
    void getCurrentProfileUsesAuthenticatedProfileId() {
        when(currentUserProvider.requireProfile()).thenReturn(authenticatedProfile());
        when(profileRepository.findById(PROFILE_ID)).thenReturn(Optional.of(profile("CarryOne", "SI")));

        var response = profileService.getCurrentProfile();

        assertThat(response.id()).isEqualTo(PROFILE_ID);
        assertThat(response.nickname()).isEqualTo("CarryOne");
        assertThat(response.steamId64()).isEqualTo("76561190000000001");
        assertThat(response.opendotaAccountId()).isEqualTo(39734273L);
        verify(profileRepository).findById(PROFILE_ID);
    }

    @Test
    void createCurrentProfileUsesAuthenticatedUserAndNormalizesInput() {
        when(currentUserProvider.requireAuthUserId()).thenReturn(AUTH_USER_ID);
        when(profileRepository.findByAuthUserId(AUTH_USER_ID)).thenReturn(Optional.empty());
        when(profileRepository.create(org.mockito.ArgumentMatchers.any())).thenReturn(profile("CarryOne", "SI"));

        profileService.createCurrentProfile(new CreateProfileRequest(
                "  CarryOne  ",
                "  Carry One  ",
                " https://cdn.example.test/avatar.png ",
                "  Position one player  ",
                "si"));

        ArgumentCaptor<CreateProfileCommand> captor = ArgumentCaptor.forClass(CreateProfileCommand.class);
        verify(profileRepository).create(captor.capture());

        assertThat(captor.getValue().authUserId()).isEqualTo(AUTH_USER_ID);
        assertThat(captor.getValue().nickname()).isEqualTo("CarryOne");
        assertThat(captor.getValue().displayName()).isEqualTo("Carry One");
        assertThat(captor.getValue().avatarUrl()).isEqualTo("https://cdn.example.test/avatar.png");
        assertThat(captor.getValue().bio()).isEqualTo("Position one player");
        assertThat(captor.getValue().countryCode()).isEqualTo("SI");
    }

    @Test
    void createCurrentProfileRejectsDuplicateProfileForUser() {
        when(currentUserProvider.requireAuthUserId()).thenReturn(AUTH_USER_ID);
        when(profileRepository.findByAuthUserId(AUTH_USER_ID)).thenReturn(Optional.of(profile("CarryOne", "SI")));

        assertThatThrownBy(() -> profileService.createCurrentProfile(new CreateProfileRequest(
                "CarryOne",
                null,
                null,
                null,
                null)))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Authenticated user already has a profile.");
    }

    @Test
    void updateCurrentProfileRequiresAtLeastOneField() {
        assertThatThrownBy(() -> profileService.updateCurrentProfile(new UpdateProfileRequest(
                null,
                null,
                null,
                null,
                null)))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("At least one profile field must be provided.");
    }

    @Test
    void updateCurrentProfileNormalizesPatchFields() {
        when(currentUserProvider.requireAuthUserId()).thenReturn(AUTH_USER_ID);
        when(profileRepository.updateByAuthUserId(
                org.mockito.ArgumentMatchers.eq(AUTH_USER_ID),
                org.mockito.ArgumentMatchers.any())).thenReturn(Optional.of(profile("SupportTwo", "DE")));

        profileService.updateCurrentProfile(new UpdateProfileRequest(
                " SupportTwo ",
                null,
                null,
                "  Draft caller  ",
                "de"));

        ArgumentCaptor<UpdateProfileCommand> captor = ArgumentCaptor.forClass(UpdateProfileCommand.class);
        verify(profileRepository).updateByAuthUserId(org.mockito.ArgumentMatchers.eq(AUTH_USER_ID), captor.capture());

        assertThat(captor.getValue().nickname()).isEqualTo("SupportTwo");
        assertThat(captor.getValue().displayName()).isNull();
        assertThat(captor.getValue().bio()).isEqualTo("Draft caller");
        assertThat(captor.getValue().countryCode()).isEqualTo("DE");
    }

    private AuthenticatedProfile authenticatedProfile() {
        return new AuthenticatedProfile(
                PROFILE_ID,
                null,
                "steam_player",
                ProfileRole.PLAYER);
    }

    private Profile profile(String nickname, String countryCode) {
        OffsetDateTime now = OffsetDateTime.parse("2026-05-12T00:00:00Z");

        return new Profile(
                PROFILE_ID,
                AUTH_USER_ID,
                nickname,
                nickname,
                "76561190000000001",
                39734273L,
                ProfileRole.PLAYER,
                "https://cdn.example.test/avatar.png",
                "Dota player",
                countryCode,
                now,
                now,
                now,
                now);
    }
}
