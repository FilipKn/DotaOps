export type Priority = "P1" | "P2" | "P3";

export type TournamentStatus =
  | "draft"
  | "registration"
  | "published"
  | "live"
  | "finished";

export type MatchStatus =
  | "scheduled"
  | "ready"
  | "live"
  | "finished"
  | "processing"
  | "error";

export type ImportStatus = "idle" | "processing" | "ready" | "error";

export interface Player {
  id: string;
  nickname: string;
  role: string;
  kda: number;
  winRate: number;
  favoriteHero: string;
}

export interface Team {
  id: string;
  name: string;
  captain: string;
  region: string;
  roster: Player[];
  winRate: number;
  kda: number;
  favoriteHeroes: string[];
  lastFive: Array<"W" | "L">;
}

export interface Tournament {
  id: string;
  slug: string;
  title: string;
  status: TournamentStatus;
  format: string;
  startsAt: string;
  teamsCount: number;
  registrationsCount: number;
  organizer: string;
  prizePool: string;
  description: string;
}

export interface Match {
  id: string;
  tournamentSlug: string;
  round: string;
  teamA: string;
  teamB: string;
  scoreA?: number;
  scoreB?: number;
  startsAt: string;
  status: MatchStatus;
  dotaMatchId?: string;
  importStatus?: ImportStatus;
}

export interface HeroMetric {
  hero: string;
  pickRate: number;
  winRate: number;
  avgKda: number;
}

export interface RoadmapItem {
  iteration: string;
  title: string;
  status: "planned" | "active" | "done";
  items: string[];
}

export interface ApiResult<T> {
  data: T;
  source: "api" | "mock";
}
