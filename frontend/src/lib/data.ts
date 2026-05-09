import { fetchApi } from "@/lib/api";
import {
  heroMetrics,
  matches,
  roadmap,
  teams,
  tournaments
} from "@/lib/mock-data";
import type { HeroMetric, Match, RoadmapItem, Team, Tournament } from "@/lib/types";

export interface AnalyticsData {
  heroMetrics: HeroMetric[];
  teams: Team[];
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
  const result = await fetchApi<Team[]>("/teams", teams);

  return result.data;
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
