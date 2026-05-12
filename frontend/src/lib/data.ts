import { fetchApi } from "@/lib/api";
import {
  heroMetrics,
  matches,
  roadmap,
  teams,
  tournaments
} from "@/lib/mock-data";
import type { HeroMetric, Match, Player, RoadmapItem, Team, Tournament } from "@/lib/types";

export interface AnalyticsData {
  heroMetrics: HeroMetric[];
  teams: Team[];
}

interface BackendTeamResponse {
  id: string;
  name: string;
  tag?: string | null;
  slug: string;
  captainProfileId?: string | null;
  captainNickname?: string | null;
  region?: string | null;
  logoUrl?: string | null;
  description?: string | null;
}

interface BackendTeamMemberResponse {
  id: string;
  profileId: string;
  nickname: string;
  displayName?: string | null;
  role: string;
  active: boolean;
}

const fallbackForm: Team["lastFive"] = ["W", "L", "W", "L", "W"];

function roleLabel(role: string) {
  return role
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(" ");
}

function toPlayer(member: BackendTeamMemberResponse): Player {
  return {
    favoriteHero: "N/A",
    id: member.profileId,
    kda: 0,
    nickname: member.displayName || member.nickname,
    role: roleLabel(member.role),
    winRate: 0
  };
}

function toTeam(team: BackendTeamResponse, members: BackendTeamMemberResponse[]): Team {
  const demoFallback = teams.find(
    (fallbackTeam) => fallbackTeam.id === team.id || fallbackTeam.name === team.name
  );
  const roster = members.filter((member) => member.active).map(toPlayer);

  return {
    captain: team.captainNickname ?? demoFallback?.captain ?? "Unassigned",
    favoriteHeroes: demoFallback?.favoriteHeroes ?? [],
    id: team.id,
    kda: demoFallback?.kda ?? 0,
    lastFive: demoFallback?.lastFive ?? fallbackForm,
    name: team.name,
    region: team.region ?? demoFallback?.region ?? "N/A",
    roster: roster.length > 0 ? roster : demoFallback?.roster ?? [],
    winRate: demoFallback?.winRate ?? 0
  };
}

export async function getTournaments() {
  const result = await fetchApi<Tournament[]>("/tournaments", tournaments);

  return result.data;
}

export async function getTournamentBySlug(slug: string) {
  const fallback = tournaments.find((tournament) => tournament.slug === slug) ?? null;
  const result = await fetchApi<Tournament | null>(`/tournaments/${slug}`, fallback);

  return result.data;
}

export async function getTeams() {
  const result = await fetchApi<BackendTeamResponse[]>("/teams", []);

  if (result.source !== "api") {
    return teams;
  }

  return Promise.all(
    result.data.map(async (team) => {
      const membersResult = await fetchApi<BackendTeamMemberResponse[]>(
        `/teams/${team.id}/members`,
        []
      );

      return toTeam(team, membersResult.source === "api" ? membersResult.data : []);
    })
  );
}

export async function getMatches() {
  const result = await fetchApi<Match[]>("/matches", matches);

  return result.data;
}

export async function getAnalytics() {
  const result = await fetchApi<AnalyticsData>("/analytics", {
    heroMetrics,
    teams
  });

  return result.data;
}

export async function getRoadmap() {
  const result = await fetchApi<RoadmapItem[]>("/roadmap", roadmap);

  return result.data;
}
