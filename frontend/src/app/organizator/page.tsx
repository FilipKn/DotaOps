import {
  Brackets,
  CalendarDays,
  DatabaseZap,
  GitBranch,
  Save,
  Send,
  UsersRound
} from "lucide-react";

import { MatchImportPanel } from "@/components/match-import-panel";
import { OrganizerActionGrid } from "@/components/organizer-action-grid";
import { OrganizerCommandHeader } from "@/components/organizer-command-header";
import { OrganizerStatusPanel } from "@/components/organizer-status-panel";
import { OrganizerWorkflowPanel } from "@/components/organizer-workflow-panel";
import { PriorityRoadmap } from "@/components/priority-roadmap";
import { SectionHeader } from "@/components/section-header";
import { getMatches, getRoadmap, getTournaments } from "@/lib/data";

export default async function OrganizerPage() {
  const [matches, roadmap, tournaments] = await Promise.all([
    getMatches(),
    getRoadmap(),
    getTournaments()
  ]);
  const registrationTournament = tournaments.find(
    (tournament) => tournament.status === "registration"
  );
  const activeRoadmapItems = roadmap.filter((item) => item.status === "active").length;
  const importedMatches = matches.filter((match) => match.dotaMatchId).length;
  const totalRegistrations = tournaments.reduce(
    (total, tournament) => total + tournament.registrationsCount,
    0
  );
  const scheduledMatches = matches.filter((match) => match.status === "scheduled").length;

  return (
    <div className="organizer-command">
      <OrganizerCommandHeader
        activeRoadmapItems={activeRoadmapItems}
        importedMatches={importedMatches}
        registrationCount={totalRegistrations}
        tournamentCount={tournaments.length}
      />

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

      <section className="organizer-command-panel organizer-roadmap-panel ops-panel">
        <SectionHeader
          eyebrow="Execution Plan"
          title="Operational Development and Status Plan"
          description="Project document summary displayed as a P1/P2/P3 roadmap for future development."
        />
        <PriorityRoadmap items={roadmap} />
      </section>
    </div>
  );
}
