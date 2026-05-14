"use client";

import {
  Brackets,
  CalendarDays,
  DatabaseZap,
  GitBranch,
  Save,
  Send,
  UsersRound
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { MatchImportPanel } from "@/components/match-import-panel";
import { OrganizerActionGrid } from "@/components/organizer-action-grid";
import { OrganizerCommandHeader } from "@/components/organizer-command-header";
import { OrganizerLaunchChecklist } from "@/components/organizer-launch-checklist";
import { OrganizerStatusPanel } from "@/components/organizer-status-panel";
import { OrganizerWorkflowPanel } from "@/components/organizer-workflow-panel";
import { SectionHeader } from "@/components/section-header";
import { ApiRequestError } from "@/lib/api";
import { getOrganizerTournamentsForCurrentUser } from "@/lib/tournament-data";
import type { Match, Tournament } from "@/lib/types";

interface OrganizerCommandPageProps {
  fallbackTournaments: Tournament[];
  matches: Match[];
}

type OrganizerLoadState = "loading" | "ready" | "fallback" | "login" | "permission";

export function OrganizerCommandPage({
  fallbackTournaments,
  matches
}: OrganizerCommandPageProps) {
  const [state, setState] = useState<OrganizerLoadState>("loading");
  const [message, setMessage] = useState<string | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  useEffect(() => {
    let isMounted = true;

    async function loadOrganizerTournaments() {
      setState("loading");
      setMessage(null);

      try {
        const organizerTournaments = await getOrganizerTournamentsForCurrentUser();

        if (!isMounted) {
          return;
        }

        setTournaments(organizerTournaments);
        setState("ready");
      } catch (error) {
        if (!isMounted) {
          return;
        }

        if (error instanceof ApiRequestError && error.status === 401) {
          setTournaments([]);
          setMessage("Login session expired. Please log in again.");
          setState("login");
          return;
        }

        if (error instanceof ApiRequestError && error.status === 403) {
          setTournaments([]);
          setMessage("Organizer access is required for this command center.");
          setState("permission");
          return;
        }

        setTournaments(fallbackTournaments);
        setMessage("Organizer API is unavailable. Showing public tournament fallback data.");
        setState("fallback");
      }
    }

    void loadOrganizerTournaments();

    return () => {
      isMounted = false;
    };
  }, [fallbackTournaments]);

  const registrationTournament = useMemo(
    () => tournaments.find((tournament) => tournament.status === "registration"),
    [tournaments]
  );
  const importedMatches = matches.filter((match) => match.dotaMatchId).length;
  const totalRegistrations = tournaments.reduce(
    (total, tournament) => total + tournament.registrationsCount,
    0
  );
  const scheduledMatches = matches.filter((match) => match.status === "scheduled").length;

  if (state === "login" || state === "permission") {
    return (
      <div className="organizer-command">
        <section className="organizer-command-panel ops-panel">
          <SectionHeader
            eyebrow="Organizer operations"
            title={state === "login" ? "Login Required" : "Organizer Access Required"}
            description={message ?? "This command center requires an authenticated organizer session."}
            action={
              state === "login" ? (
                <Link className="button ops-button-primary" href="/login">
                  Login
                </Link>
              ) : null
            }
          />
        </section>
      </div>
    );
  }

  return (
    <div className="organizer-command">
      <OrganizerCommandHeader
        activeChecklistItems={4}
        importedMatches={importedMatches}
        registrationCount={totalRegistrations}
        tournamentCount={tournaments.length}
      />

      {message ? <p className="auth-message auth-error">{message}</p> : null}
      {state === "loading" ? <p className="ops-label">Loading organizer tournaments...</p> : null}

      <section className="organizer-command-panel ops-panel">
        <SectionHeader
          eyebrow="Command tasks"
          title="Operational Tasks"
          description="Quick overview of key organizer flows: tournament, registrations, matches, bracket, and data import."
        />
        <OrganizerActionGrid
          actions={[
            {
              detail: "form + publishing",
              icon: CalendarDays,
              label: "Tournament",
              tone: "red",
              value: registrationTournament?.title ?? "Draft"
            },
            {
              detail: "teams in registration",
              icon: UsersRound,
              label: "Registrations",
              tone: "cyan",
              value: String(totalRegistrations)
            },
            {
              detail: "scheduled for execution",
              icon: GitBranch,
              label: "Matches",
              tone: "gold",
              value: String(scheduledMatches)
            },
            {
              detail: "match_id links",
              icon: DatabaseZap,
              label: "OpenDota",
              tone: "green",
              value: String(importedMatches)
            }
          ]}
        />
      </section>

      <section className="organizer-main-grid">
        <div className="organizer-main-stack">
          <section className="organizer-command-panel organizer-form-panel ops-panel">
            <SectionHeader
              eyebrow="Tournament editor"
              title="Core Tournament Data"
              description="Fields are ready to connect to validation and the Spring Boot API."
              action={
                <span className="ops-badge">
                  <Brackets size={14} />
                  draft mode
                </span>
              }
            />

            <form className="form-grid organizer-form-grid">
              <label>
                <span>Tournament Name</span>
                <input defaultValue={registrationTournament?.title ?? ""} />
              </label>
              <label>
                <span>Format</span>
                <select defaultValue={registrationTournament?.format ?? "Single elimination"}>
                  <option>Single elimination</option>
                  <option>Groups + playoff</option>
                  <option>Best of 3 playoff</option>
                </select>
              </label>
              <label>
                <span>Start</span>
                <input defaultValue="2026-05-20T19:00" type="datetime-local" />
              </label>
              <label>
                <span>Number of Teams</span>
                <input
                  defaultValue={registrationTournament?.teamsCount ?? 8}
                  min={2}
                  type="number"
                />
              </label>
              <label className="form-wide">
                <span>Description</span>
                <textarea defaultValue={registrationTournament?.description ?? ""} rows={4} />
              </label>
              <div className="form-actions">
                <button className="button ops-button-secondary" type="button">
                  <Save size={18} />
                  <span>Save Draft</span>
                </button>
                <button className="button ops-button-primary" type="button">
                  <Send size={18} />
                  <span>Publish</span>
                </button>
              </div>
            </form>
          </section>

          <section className="organizer-command-panel ops-panel">
            <SectionHeader
              eyebrow="Workflow"
              title="Tournament Operations Flow"
              description="From tournament setup to public result publishing and analytics."
            />
            <OrganizerWorkflowPanel />
          </section>
        </div>

        <aside className="organizer-side-stack">
          <OrganizerStatusPanel matches={matches} tournaments={tournaments} />
          <div className="organizer-import-shell ops-panel">
            <MatchImportPanel />
          </div>
        </aside>
      </section>

      <section className="organizer-command-panel organizer-checklist-panel ops-panel">
        <SectionHeader
          eyebrow="Launch Readiness"
          title="Tournament Launch Checklist"
          description="Operational checklist for preparing a tournament from setup to public publishing."
        />
        <OrganizerLaunchChecklist />
      </section>
    </div>
  );
}
