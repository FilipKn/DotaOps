"use client";

import {
  deleteApiAuthenticated,
  fetchApi,
  getApiAuthenticated,
  patchApiAuthenticated,
  postApiAuthenticated
} from "@/lib/api";
import { getCurrentUserProfile, type CurrentUserProfile } from "@/lib/auth";
import { teams as mockTeams } from "@/lib/mock-data";
import { getSupabaseBrowserClient } from "@/lib/supabase";

export type TeamMemberRole =
  | "carry"
  | "mid"
  | "offlane"
  | "support"
  | "roamer"
  | "coach"
  | "substitute";

export type TeamInvitationStatus =
  | "pending"
  | "accepted"
  | "declined"
  | "cancelled"
  | "expired";

export interface TeamSummary {
  captainNickname: string | null;
  captainProfileId: string | null;
  description: string | null;
  id: string;
  logoUrl: string | null;
  name: string;
  region: string | null;
  slug: string;
  tag: string | null;
}

export interface TeamMember {
  active: boolean;
  avatarUrl: string | null;
  displayName: string | null;
  id: string;
  joinedAt: string | null;
  leftAt: string | null;
  nickname: string;
  profileId: string;
  role: TeamMemberRole;
  teamId: string;
  updatedAt: string | null;
}

export interface TeamInvitation {
  acceptedAt: string | null;
  createdAt: string | null;
  expiresAt: string | null;
  id: string;
  inviteeEmail: string | null;
  inviteeNickname: string | null;
  inviteeProfileId: string | null;
  inviterNickname: string | null;
  proposedRole: TeamMemberRole;
  status: TeamInvitationStatus;
  teamId: string;
  teamName: string | null;
  teamSlug: string | null;
  updatedAt: string | null;
}

export interface TournamentRegistration {
  checkedInAt: string | null;
  contactEmail: string | null;
  createdAt: string | null;
  id: string;
  status: string;
  teamId: string;
  tournamentId: string;
  tournamentSlug: string | null;
  tournamentTitle: string | null;
}

export interface TeamManagementViewModel {
  accessToken: string;
  activeEvents: TournamentRegistration[];
  canManageRoster: boolean;
  currentProfile: CurrentUserProfile;
  dataSource: "api" | "mock";
  incomingInvitations: TeamInvitation[];
  isCaptain: boolean;
  members: TeamMember[];
  outgoingInvitations: TeamInvitation[];
  protectedDataError: string | null;
  team: TeamSummary | null;
  teamResolution: string;
}

export interface TeamInvitationInput {
  invitee: string;
  proposedRole: TeamMemberRole;
}

interface BackendTeamResponse {
  captainNickname?: string | null;
  captainProfileId?: string | null;
  description?: string | null;
  id: string;
  logoUrl?: string | null;
  name: string;
  region?: string | null;
  slug: string;
  tag?: string | null;
}

interface BackendTeamMemberResponse {
  active: boolean;
  avatarUrl?: string | null;
  displayName?: string | null;
  id: string;
  joinedAt?: string | null;
  leftAt?: string | null;
  nickname: string;
  profileId: string;
  role: TeamMemberRole;
  teamId: string;
  updatedAt?: string | null;
}

interface BackendTeamInvitationResponse {
  acceptedAt?: string | null;
  createdAt?: string | null;
  expiresAt?: string | null;
  id: string;
  inviteeEmail?: string | null;
  inviteeNickname?: string | null;
  inviteeProfileId?: string | null;
  inviterNickname?: string | null;
  proposedRole?: TeamMemberRole | null;
  status: TeamInvitationStatus;
  teamId: string;
  teamName?: string | null;
  teamSlug?: string | null;
  updatedAt?: string | null;
}

interface BackendTournamentRegistrationResponse {
  checkedInAt?: string | null;
  contactEmail?: string | null;
  createdAt?: string | null;
  id: string;
  status: string;
  teamId: string;
  tournamentId: string;
  tournamentSlug?: string | null;
  tournamentTitle?: string | null;
}

const fallbackRoles: TeamMemberRole[] = ["carry", "mid", "offlane", "support", "support"];
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function requireSupabaseClient() {
  const supabase = getSupabaseBrowserClient();

  if (!supabase) {
    throw new Error("Supabase frontend environment variables are missing.");
  }

  return supabase;
}

async function getFreshAccessToken() {
  const supabase = requireSupabaseClient();
  const { data } = await supabase.auth.getSession();

  if (!data.session?.access_token) {
    throw new Error("Login session expired. Please log in again.");
  }

  return data.session.access_token;
}

function asTeam(response: BackendTeamResponse): TeamSummary {
  return {
    captainNickname: response.captainNickname ?? null,
    captainProfileId: response.captainProfileId ?? null,
    description: response.description ?? null,
    id: response.id,
    logoUrl: response.logoUrl ?? null,
    name: response.name,
    region: response.region ?? null,
    slug: response.slug,
    tag: response.tag ?? null
  };
}

function asMember(response: BackendTeamMemberResponse): TeamMember {
  return {
    active: response.active,
    avatarUrl: response.avatarUrl ?? null,
    displayName: response.displayName ?? null,
    id: response.id,
    joinedAt: response.joinedAt ?? null,
    leftAt: response.leftAt ?? null,
    nickname: response.nickname,
    profileId: response.profileId,
    role: response.role,
    teamId: response.teamId,
    updatedAt: response.updatedAt ?? null
  };
}

function asInvitation(response: BackendTeamInvitationResponse): TeamInvitation {
  return {
    acceptedAt: response.acceptedAt ?? null,
    createdAt: response.createdAt ?? null,
    expiresAt: response.expiresAt ?? null,
    id: response.id,
    inviteeEmail: response.inviteeEmail ?? null,
    inviteeNickname: response.inviteeNickname ?? null,
    inviteeProfileId: response.inviteeProfileId ?? null,
    inviterNickname: response.inviterNickname ?? null,
    proposedRole: response.proposedRole ?? "support",
    status: response.status,
    teamId: response.teamId,
    teamName: response.teamName ?? null,
    teamSlug: response.teamSlug ?? null,
    updatedAt: response.updatedAt ?? null
  };
}

function asRegistration(response: BackendTournamentRegistrationResponse): TournamentRegistration {
  return {
    checkedInAt: response.checkedInAt ?? null,
    contactEmail: response.contactEmail ?? null,
    createdAt: response.createdAt ?? null,
    id: response.id,
    status: response.status,
    teamId: response.teamId,
    tournamentId: response.tournamentId,
    tournamentSlug: response.tournamentSlug ?? null,
    tournamentTitle: response.tournamentTitle ?? null
  };
}

function mockTeamData() {
  const source = mockTeams[0];
  const team: TeamSummary = {
    captainNickname: source.captain,
    captainProfileId: "mock-captain-profile",
    description: "Elite European organization dominating the global circuit.",
    id: source.id,
    logoUrl: null,
    name: "Team Liquid",
    region: "EU West",
    slug: "team-liquid",
    tag: "TL"
  };
  const rosterSource = [
    { favoriteHero: "Morphling", id: "mock-micke", nickname: "miCKe", role: "Carry" },
    { favoriteHero: "Puck", id: "mock-nisha", nickname: "Nisha", role: "Mid" },
    { favoriteHero: "Beastmaster", id: "mock-33", nickname: "33", role: "Offlane" },
    { favoriteHero: "Tusk", id: "mock-boxi", nickname: "Boxi", role: "Support" },
    { favoriteHero: "Oracle", id: "mock-insania", nickname: "iNSaNiA", role: "Hard Support" }
  ];
  const members: TeamMember[] = rosterSource.map((player, index) => ({
    active: true,
    avatarUrl: null,
    displayName: player.nickname,
    id: `mock-member-${index}`,
    joinedAt: index === 2 ? "2023-11-02T10:00:00Z" : "2023-10-14T10:00:00Z",
    leftAt: null,
    nickname: player.nickname,
    profileId: index === 0 ? "mock-captain-profile" : player.id,
    role: fallbackRoles[index],
    teamId: team.id,
    updatedAt: null
  }));

  return { members, team };
}

function fallbackInvitations(team: TeamSummary): TeamInvitation[] {
  return [
    {
      acceptedAt: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
      expiresAt: null,
      id: "mock-invite-miracle",
      inviteeEmail: null,
      inviteeNickname: "Miracle-",
      inviteeProfileId: null,
      inviterNickname: team.captainNickname,
      proposedRole: "carry",
      status: "pending",
      teamId: team.id,
      teamName: team.name,
      teamSlug: team.slug,
      updatedAt: null
    },
    {
      acceptedAt: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
      expiresAt: null,
      id: "mock-invite-sumail",
      inviteeEmail: null,
      inviteeNickname: "SumaiL",
      inviteeProfileId: null,
      inviterNickname: team.captainNickname,
      proposedRole: "mid",
      status: "declined",
      teamId: team.id,
      teamName: team.name,
      teamSlug: team.slug,
      updatedAt: null
    }
  ];
}

function protectedErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Protected team data could not be loaded.";
}

export async function loadTeamManagementData(): Promise<TeamManagementViewModel | null> {
  const currentProfile = await getCurrentUserProfile();

  if (!currentProfile) {
    return null;
  }

  const accessToken = await getFreshAccessToken();
  const teamsResult = await fetchApi<BackendTeamResponse[]>("/teams", []);
  let dataSource: "api" | "mock" = teamsResult.source;
  let teams = teamsResult.data.map(asTeam);
  let membersByTeam = new Map<string, TeamMember[]>();

  if (teams.length > 0) {
    const memberPairs = await Promise.all(
      teams.map(async (team) => {
        const result = await fetchApi<BackendTeamMemberResponse[]>(`/teams/${team.id}/members`, []);
        return [team.id, result.data.map(asMember)] as const;
      })
    );
    membersByTeam = new Map(memberPairs);
  }

  if (teams.length === 0 && teamsResult.source === "mock") {
    const fallback = mockTeamData();
    dataSource = "mock";
    teams = [fallback.team];
    membersByTeam = new Map([[fallback.team.id, fallback.members]]);
  }

  // TODO: replace this resolution with GET /api/me/team when the backend aggregate endpoint exists.
  const membershipTeam = currentProfile.profileId
    ? teams.find((team) =>
        (membersByTeam.get(team.id) ?? []).some((member) => member.profileId === currentProfile.profileId)
      )
    : null;
  const selectedTeam = membershipTeam ?? teams[0] ?? null;
  const members = selectedTeam ? membersByTeam.get(selectedTeam.id) ?? [] : [];
  const isCaptain = Boolean(
    selectedTeam?.captainProfileId &&
      currentProfile.profileId &&
      selectedTeam.captainProfileId === currentProfile.profileId
  );
  const canManageRoster =
    isCaptain || (dataSource === "mock" && currentProfile.role === "captain");
  let outgoingInvitations: TeamInvitation[] = [];
  let incomingInvitations: TeamInvitation[] = [];
  let activeEvents: TournamentRegistration[] = [];
  let protectedDataError: string | null = null;

  try {
    incomingInvitations = (
      await getApiAuthenticated<BackendTeamInvitationResponse[]>("/me/team-invitations", accessToken)
    ).map(asInvitation);
  } catch (error) {
    protectedDataError = protectedErrorMessage(error);
  }

  if (selectedTeam && canManageRoster && dataSource === "api") {
    try {
      outgoingInvitations = (
        await getApiAuthenticated<BackendTeamInvitationResponse[]>(
          `/teams/${selectedTeam.id}/invitations`,
          accessToken
        )
      ).map(asInvitation);
    } catch (error) {
      protectedDataError = protectedDataError ?? protectedErrorMessage(error);
    }
  }

  if (selectedTeam && dataSource === "api") {
    try {
      activeEvents = (
        await getApiAuthenticated<BackendTournamentRegistrationResponse[]>(
          `/teams/${selectedTeam.id}/tournament-registrations`,
          accessToken
        )
      ).map(asRegistration);
    } catch (error) {
      protectedDataError = protectedDataError ?? protectedErrorMessage(error);
    }
  }

  if (selectedTeam && dataSource === "mock") {
    outgoingInvitations = fallbackInvitations(selectedTeam);
    activeEvents = [
      {
        checkedInAt: null,
        contactEmail: null,
        createdAt: new Date().toISOString(),
        id: "mock-registration-dreamleague",
        status: "approved",
        teamId: selectedTeam.id,
        tournamentId: "mock-dreamleague",
        tournamentSlug: "dreamleague-s22",
        tournamentTitle: "DreamLeague S22"
      },
      {
        checkedInAt: null,
        contactEmail: null,
        createdAt: new Date().toISOString(),
        id: "mock-registration-elite",
        status: "pending",
        teamId: selectedTeam.id,
        tournamentId: "mock-elite",
        tournamentSlug: "elite-league",
        tournamentTitle: "Elite League"
      }
    ];
  }

  return {
    accessToken,
    activeEvents,
    canManageRoster,
    currentProfile,
    dataSource,
    incomingInvitations,
    isCaptain,
    members,
    outgoingInvitations,
    protectedDataError,
    team: selectedTeam,
    teamResolution: membershipTeam
      ? "Resolved from current profile membership."
      : selectedTeam
        ? "Temporary fallback selected the first available team until GET /api/me/team exists."
        : "No team found for the current profile."
  };
}

export async function sendTeamInvitation(teamId: string, input: TeamInvitationInput) {
  const accessToken = await getFreshAccessToken();
  const invitee = input.invitee.trim();

  if (!invitee) {
    throw new Error("Player id or email is required.");
  }

  return asInvitation(
    await postApiAuthenticated<BackendTeamInvitationResponse>(
      `/teams/${teamId}/invitations`,
      {
        inviteeEmail: uuidPattern.test(invitee) ? null : invitee,
        inviteeProfileId: uuidPattern.test(invitee) ? invitee : null,
        proposedRole: input.proposedRole
      },
      accessToken
    )
  );
}

export async function updateTeamMemberRole(teamId: string, memberId: string, role: TeamMemberRole) {
  const accessToken = await getFreshAccessToken();

  return asMember(
    await patchApiAuthenticated<BackendTeamMemberResponse>(
      `/teams/${teamId}/members/${memberId}`,
      { role },
      accessToken
    )
  );
}

export async function removeTeamMember(teamId: string, memberId: string) {
  const accessToken = await getFreshAccessToken();

  return asMember(
    await deleteApiAuthenticated<BackendTeamMemberResponse>(
      `/teams/${teamId}/members/${memberId}`,
      accessToken
    )
  );
}

export async function acceptTeamInvitation(invitationId: string) {
  const accessToken = await getFreshAccessToken();

  return asInvitation(
    await postApiAuthenticated<BackendTeamInvitationResponse>(
      `/team-invitations/${invitationId}/accept`,
      {},
      accessToken
    )
  );
}

export async function declineTeamInvitation(invitationId: string) {
  const accessToken = await getFreshAccessToken();

  return asInvitation(
    await postApiAuthenticated<BackendTeamInvitationResponse>(
      `/team-invitations/${invitationId}/decline`,
      {},
      accessToken
    )
  );
}

export async function cancelTeamInvitation(invitationId: string) {
  const accessToken = await getFreshAccessToken();

  return asInvitation(
    await postApiAuthenticated<BackendTeamInvitationResponse>(
      `/team-invitations/${invitationId}/cancel`,
      {},
      accessToken
    )
  );
}
