package si.um.feri.dotaops.backend.team.service;

import java.time.OffsetDateTime;
import java.util.Optional;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.access.AccessDeniedException;

import si.um.feri.dotaops.backend.auth.domain.AuthenticatedProfile;
import si.um.feri.dotaops.backend.auth.domain.ProfileRole;
import si.um.feri.dotaops.backend.auth.service.CurrentUserProvider;
import si.um.feri.dotaops.backend.auth.service.SupabasePrincipal;
import si.um.feri.dotaops.backend.common.error.BadRequestException;
import si.um.feri.dotaops.backend.profile.domain.Profile;
import si.um.feri.dotaops.backend.profile.repository.ProfileRepository;
import si.um.feri.dotaops.backend.team.domain.Team;
import si.um.feri.dotaops.backend.team.domain.TeamInvitation;
import si.um.feri.dotaops.backend.team.domain.TeamInvitationStatus;
import si.um.feri.dotaops.backend.team.domain.TeamMember;
import si.um.feri.dotaops.backend.team.domain.TeamMemberRole;
import si.um.feri.dotaops.backend.team.repository.CreateTeamInvitationCommand;
import si.um.feri.dotaops.backend.team.repository.CreateTeamMemberCommand;
import si.um.feri.dotaops.backend.team.repository.TeamInvitationRepository;
import si.um.feri.dotaops.backend.team.repository.TeamMemberRepository;
import si.um.feri.dotaops.backend.team.repository.TeamRepository;
import si.um.feri.dotaops.backend.team.web.AddTeamMemberRequest;
import si.um.feri.dotaops.backend.team.web.CreateTeamInvitationRequest;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class TeamRosterServiceTest {

    private static final UUID AUTH_USER_ID = UUID.fromString("11111111-1111-4111-8111-111111111111");
    private static final UUID CAPTAIN_PROFILE_ID = UUID.fromString("22222222-2222-4222-8222-222222222222");
    private static final UUID INVITEE_PROFILE_ID = UUID.fromString("33333333-3333-4333-8333-333333333333");
    private static final UUID OTHER_PROFILE_ID = UUID.fromString("44444444-4444-4444-8444-444444444444");
    private static final UUID TEAM_ID = UUID.fromString("55555555-5555-4555-8555-555555555555");
    private static final UUID MEMBER_ID = UUID.fromString("66666666-6666-4666-8666-666666666666");
    private static final UUID INVITATION_ID = UUID.fromString("77777777-7777-4777-8777-777777777777");
    private static final OffsetDateTime NOW = OffsetDateTime.parse("2026-05-12T00:00:00Z");

    private final TeamRepository teamRepository = mock(TeamRepository.class);
    private final TeamMemberRepository teamMemberRepository = mock(TeamMemberRepository.class);
    private final TeamInvitationRepository teamInvitationRepository = mock(TeamInvitationRepository.class);
    private final ProfileRepository profileRepository = mock(ProfileRepository.class);
    private final CurrentUserProvider currentUserProvider = mock(CurrentUserProvider.class);
    private final TeamRosterService teamRosterService = new TeamRosterService(
            teamRepository,
            teamMemberRepository,
            teamInvitationRepository,
            profileRepository,
            currentUserProvider);

    @Test
    void captainCanAddMemberToOwnTeam() {
        when(teamRepository.findById(TEAM_ID)).thenReturn(Optional.of(team()));
        when(currentUserProvider.requireProfile()).thenReturn(authenticatedProfile(CAPTAIN_PROFILE_ID, ProfileRole.PLAYER));
        when(profileRepository.findById(INVITEE_PROFILE_ID)).thenReturn(Optional.of(profile(INVITEE_PROFILE_ID)));
        when(teamMemberRepository.create(any())).thenReturn(member(true, TeamMemberRole.MID));

        teamRosterService.addMember(TEAM_ID, new AddTeamMemberRequest(INVITEE_PROFILE_ID, TeamMemberRole.MID));

        ArgumentCaptor<CreateTeamMemberCommand> captor = ArgumentCaptor.forClass(CreateTeamMemberCommand.class);
        verify(teamMemberRepository).create(captor.capture());

        assertThat(captor.getValue().teamId()).isEqualTo(TEAM_ID);
        assertThat(captor.getValue().profileId()).isEqualTo(INVITEE_PROFILE_ID);
        assertThat(captor.getValue().role()).isEqualTo(TeamMemberRole.MID);
    }

    @Test
    void nonCaptainCannotAddMember() {
        when(teamRepository.findById(TEAM_ID)).thenReturn(Optional.of(team()));
        when(currentUserProvider.requireProfile()).thenReturn(authenticatedProfile(OTHER_PROFILE_ID, ProfileRole.PLAYER));

        assertThatThrownBy(() -> teamRosterService.addMember(
                TEAM_ID,
                new AddTeamMemberRequest(INVITEE_PROFILE_ID, TeamMemberRole.SUPPORT)))
                .isInstanceOf(AccessDeniedException.class);

        verify(teamMemberRepository, never()).create(any());
    }

    @Test
    void deactivateMemberKeepsHistoricalRow() {
        when(teamRepository.findById(TEAM_ID)).thenReturn(Optional.of(team()));
        when(currentUserProvider.requireProfile()).thenReturn(authenticatedProfile(CAPTAIN_PROFILE_ID, ProfileRole.PLAYER));
        when(teamMemberRepository.deactivate(TEAM_ID, MEMBER_ID)).thenReturn(Optional.of(member(false, TeamMemberRole.SUPPORT)));

        var response = teamRosterService.deactivateMember(TEAM_ID, MEMBER_ID);

        assertThat(response.active()).isFalse();
        assertThat(response.leftAt()).isEqualTo(NOW);
    }

    @Test
    void createInvitationRejectsDuplicatePendingProfileInvitation() {
        when(teamRepository.findById(TEAM_ID)).thenReturn(Optional.of(team()));
        when(currentUserProvider.requireProfile()).thenReturn(authenticatedProfile(CAPTAIN_PROFILE_ID, ProfileRole.PLAYER));
        when(profileRepository.findById(INVITEE_PROFILE_ID)).thenReturn(Optional.of(profile(INVITEE_PROFILE_ID)));
        when(teamInvitationRepository.findPendingByTeamAndInviteeProfile(TEAM_ID, INVITEE_PROFILE_ID))
                .thenReturn(Optional.of(invitation(TeamInvitationStatus.PENDING, INVITEE_PROFILE_ID, null, null)));

        assertThatThrownBy(() -> teamRosterService.createInvitation(
                TEAM_ID,
                new CreateTeamInvitationRequest(INVITEE_PROFILE_ID, null, TeamMemberRole.CARRY, null)))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Pending invitation already exists for this team and profile.");

        verify(teamInvitationRepository, never()).create(any(CreateTeamInvitationCommand.class));
    }

    @Test
    void invitedUserAcceptsInvitationAndBecomesMember() {
        when(teamInvitationRepository.findById(INVITATION_ID))
                .thenReturn(Optional.of(invitation(TeamInvitationStatus.PENDING, INVITEE_PROFILE_ID, null, null)));
        when(currentUserProvider.requireProfile()).thenReturn(authenticatedProfile(INVITEE_PROFILE_ID, ProfileRole.PLAYER));
        when(currentUserProvider.currentUser()).thenReturn(Optional.of(principal(INVITEE_PROFILE_ID, "player@example.com")));
        when(teamInvitationRepository.accept(INVITATION_ID, INVITEE_PROFILE_ID))
                .thenReturn(Optional.of(invitation(TeamInvitationStatus.ACCEPTED, INVITEE_PROFILE_ID, null, NOW)));
        when(teamMemberRepository.create(any())).thenReturn(member(true, TeamMemberRole.CARRY));

        var response = teamRosterService.acceptInvitation(INVITATION_ID);

        ArgumentCaptor<CreateTeamMemberCommand> captor = ArgumentCaptor.forClass(CreateTeamMemberCommand.class);
        verify(teamMemberRepository).create(captor.capture());

        assertThat(response.status()).isEqualTo(TeamInvitationStatus.ACCEPTED);
        assertThat(captor.getValue().profileId()).isEqualTo(INVITEE_PROFILE_ID);
        assertThat(captor.getValue().role()).isEqualTo(TeamMemberRole.CARRY);
    }

    @Test
    void unrelatedUserCannotAcceptInvitation() {
        when(teamInvitationRepository.findById(INVITATION_ID))
                .thenReturn(Optional.of(invitation(TeamInvitationStatus.PENDING, INVITEE_PROFILE_ID, null, null)));
        when(currentUserProvider.requireProfile()).thenReturn(authenticatedProfile(OTHER_PROFILE_ID, ProfileRole.PLAYER));
        when(currentUserProvider.currentUser()).thenReturn(Optional.of(principal(OTHER_PROFILE_ID, "other@example.com")));

        assertThatThrownBy(() -> teamRosterService.acceptInvitation(INVITATION_ID))
                .isInstanceOf(AccessDeniedException.class);

        verify(teamMemberRepository, never()).create(any());
    }

    @Test
    void expiredInvitationIsMarkedExpiredBeforeRejectingResponse() {
        OffsetDateTime past = OffsetDateTime.parse("2020-01-01T00:00:00Z");
        when(teamInvitationRepository.findById(INVITATION_ID))
                .thenReturn(Optional.of(invitation(TeamInvitationStatus.PENDING, INVITEE_PROFILE_ID, null, null, past)));
        when(currentUserProvider.requireProfile()).thenReturn(authenticatedProfile(INVITEE_PROFILE_ID, ProfileRole.PLAYER));

        assertThatThrownBy(() -> teamRosterService.acceptInvitation(INVITATION_ID))
                .isInstanceOf(BadRequestException.class)
                .hasMessage("Team invitation has expired.");

        verify(teamInvitationRepository).expire(INVITATION_ID);
        verify(teamMemberRepository, never()).create(any());
    }

    private static Team team() {
        return new Team(
                TEAM_ID,
                "Ancient Stack",
                "AS",
                "ancient-stack",
                CAPTAIN_PROFILE_ID,
                "Captain",
                "EU",
                null,
                null,
                AUTH_USER_ID,
                NOW,
                NOW);
    }

    private static TeamMember member(boolean active, TeamMemberRole role) {
        return new TeamMember(
                MEMBER_ID,
                TEAM_ID,
                INVITEE_PROFILE_ID,
                "CarryOne",
                "Carry One",
                null,
                role,
                active,
                NOW,
                active ? null : NOW,
                NOW);
    }

    private static TeamInvitation invitation(
            TeamInvitationStatus status,
            UUID inviteeProfileId,
            String inviteeEmail,
            OffsetDateTime acceptedAt
    ) {
        return invitation(status, inviteeProfileId, inviteeEmail, acceptedAt, NOW.plusDays(1));
    }

    private static TeamInvitation invitation(
            TeamInvitationStatus status,
            UUID inviteeProfileId,
            String inviteeEmail,
            OffsetDateTime acceptedAt,
            OffsetDateTime expiresAt
    ) {
        return new TeamInvitation(
                INVITATION_ID,
                TEAM_ID,
                "Ancient Stack",
                "ancient-stack",
                CAPTAIN_PROFILE_ID,
                "Captain",
                inviteeProfileId,
                "CarryOne",
                inviteeEmail,
                TeamMemberRole.CARRY,
                status,
                expiresAt,
                acceptedAt,
                NOW,
                NOW);
    }

    private static Profile profile(UUID profileId) {
        return new Profile(
                profileId,
                AUTH_USER_ID,
                "CarryOne",
                "Carry One",
                null,
                null,
                ProfileRole.PLAYER,
                null,
                null,
                "SI",
                null,
                null,
                NOW,
                NOW);
    }

    private static AuthenticatedProfile authenticatedProfile(UUID profileId, ProfileRole role) {
        return new AuthenticatedProfile(
                profileId,
                AUTH_USER_ID,
                "Captain",
                role);
    }

    private static SupabasePrincipal principal(UUID profileId, String email) {
        return new SupabasePrincipal(
                AUTH_USER_ID,
                email,
                Optional.of(authenticatedProfile(profileId, ProfileRole.PLAYER)),
                null);
    }
}
