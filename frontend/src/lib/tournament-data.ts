import {
  ApiRequestError,
  getApi,
  getApiAuthenticated,
  patchApiAuthenticated,
  postApiAuthenticated
} from "@/lib/api";
import { tournaments as mockTournaments } from "@/lib/mock-data";
import type { Tournament, TournamentStatus } from "@/lib/types";

interface BackendTournamentDto {
  id?: string | null;
  slug?: string | null;
  title?: string | null;
  status?: string | null;
  format?: string | null;
  organizer?: string | null;
  organizerNickname?: string | null;
  description?: string | null;
  rules?: string | null;
  prizePool?: string | null;
  maxTeams?: number | null;
  registrationsCount?: number | null;
  startsAt?: string | null;
  endsAt?: string | null;
  registrationOpensAt?: string | null;
  registrationClosesAt?: string | null;
  checkInOpensAt?: string | null;
  checkInClosesAt?: string | null;
  timezone?: string | null;
  publicVisible?: boolean | null;
  publishedAt?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface TournamentWriteInput {
  checkInClosesAt?: string | null;
  checkInOpensAt?: string | null;
  description?: string | null;
  endsAt?: string | null;
  format?: string | null;
  maxTeams?: number | null;
  prizePool?: string | null;
  registrationClosesAt?: string | null;
  registrationOpensAt?: string | null;
  rules?: string | null;
  slug?: string | null;
  startsAt?: string | null;
  timezone?: string | null;
  title?: string | null;
}

const fallbackDate = "2026-05-20T19:00:00Z";
const validStatuses: TournamentStatus[] = [
  "draft",
  "registration",
  "published",
  "live",
  "finished",
  "archived"
];

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function normalizeStatus(status?: string | null): TournamentStatus {
  return validStatuses.includes(status as TournamentStatus)
    ? (status as TournamentStatus)
    : "draft";
}

function fallbackSlug(value: BackendTournamentDto) {
  if (value.slug) {
    return value.slug;
  }

  return (value.title ?? value.id ?? "tournament")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function mapTournamentDto(value: BackendTournamentDto): Tournament {
  const id = value.id ?? fallbackSlug(value);

  return {
    description: value.description ?? "Tournament details are being prepared.",
    format: value.format ?? "Dota 2",
    id,
    organizer: value.organizerNickname ?? value.organizer ?? "DotaOps",
    prizePool: value.prizePool ?? "TBD",
    registrationsCount: value.registrationsCount ?? 0,
    slug: fallbackSlug(value),
    startsAt: value.startsAt ?? fallbackDate,
    status: normalizeStatus(value.status),
    teamsCount: value.maxTeams ?? 0,
    title: value.title ?? "Untitled Tournament"
  };
}

function safeMapTournamentList(value: unknown): Tournament[] {
  if (!Array.isArray(value)) {
    console.warn("Tournament API returned an unexpected payload shape.", {
      expected: "array"
    });
    return mockTournaments;
  }

  const invalidItems = value.filter((item) => !isRecord(item));

  if (invalidItems.length > 0) {
    console.warn("Tournament API returned invalid list items.", {
      invalidItems: invalidItems.length
    });
    return mockTournaments;
  }

  return value.map((item) => mapTournamentDto(item as BackendTournamentDto));
}

function safeMapTournament(value: unknown, fallback: Tournament | null): Tournament | null {
  if (!value) {
    return fallback;
  }

  if (!isRecord(value)) {
    console.warn("Tournament API returned an unexpected detail payload shape.");
    return fallback;
  }

  return mapTournamentDto(value as BackendTournamentDto);
}

function fallbackTournaments() {
  return mockTournaments;
}

export async function getPublicTournaments(): Promise<Tournament[]> {
  try {
    return safeMapTournamentList(
      await getApi<unknown>("/tournaments", {
        cache: "force-cache",
        next: { revalidate: 30 }
      })
    );
  } catch (error) {
    console.warn("Public tournaments API unavailable; using mock fallback.", error);
    return fallbackTournaments();
  }
}

export async function getPublicTournamentBySlug(slug: string): Promise<Tournament | null> {
  const fallback = mockTournaments.find((tournament) => tournament.slug === slug) ?? null;

  try {
    return safeMapTournament(
      await getApi<unknown>(`/tournaments/${slug}`, {
        cache: "force-cache",
        next: { revalidate: 30 }
      }),
      fallback
    );
  } catch (error) {
    console.warn("Public tournament detail API unavailable; using mock fallback.", error);
    return fallback;
  }
}

export async function getOrganizerTournamentsForCurrentUser(): Promise<Tournament[]> {
  return safeMapTournamentList(await getApiAuthenticated<unknown>("/organizer/tournaments"));
}

export async function getOrganizerTournamentForCurrentUser(
  tournamentId: string
): Promise<Tournament> {
  const tournament = safeMapTournament(
    await getApiAuthenticated<unknown>(`/organizer/tournaments/${tournamentId}`),
    null
  );

  if (!tournament) {
    throw new ApiRequestError("Organizer tournament was not found.", 404);
  }

  return tournament;
}

export async function createOrganizerTournament(input: TournamentWriteInput): Promise<Tournament> {
  return mapTournamentDto(
    await postApiAuthenticated<BackendTournamentDto>("/organizer/tournaments", input)
  );
}

export async function updateOrganizerTournament(
  tournamentId: string,
  input: TournamentWriteInput
): Promise<Tournament> {
  return mapTournamentDto(
    await patchApiAuthenticated<BackendTournamentDto>(
      `/organizer/tournaments/${tournamentId}`,
      input
    )
  );
}

export async function publishOrganizerTournament(tournamentId: string): Promise<Tournament> {
  return mapTournamentDto(
    await postApiAuthenticated<BackendTournamentDto>(
      `/organizer/tournaments/${tournamentId}/publish`,
      {}
    )
  );
}

export async function archiveOrganizerTournament(tournamentId: string): Promise<Tournament> {
  return mapTournamentDto(
    await postApiAuthenticated<BackendTournamentDto>(
      `/organizer/tournaments/${tournamentId}/archive`,
      {}
    )
  );
}
