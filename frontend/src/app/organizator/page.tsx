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
          title="Operativne naloge"
          description="Hitri pregled glavnih organizatorskih tokov: turnir, prijave, tekme, bracket in podatkovni uvoz."
        />
        <OrganizerActionGrid
          actions={[
            {
              detail: "obrazec + objava",
              icon: CalendarDays,
              label: "Turnir",
              tone: "red",
              value: registrationTournament?.title ?? "Osnutek"
            },
            {
              detail: "ekipe v prijavah",
              icon: UsersRound,
              label: "Prijave",
              tone: "cyan",
              value: String(totalRegistrations)
            },
            {
              detail: "planirano za izvedbo",
              icon: GitBranch,
              label: "Tekme",
              tone: "gold",
              value: String(scheduledMatches)
            },
            {
              detail: "match_id povezave",
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
              title="Osnovni podatki turnirja"
              description="Polja so pripravljena za povezavo z validacijami in Spring Boot API-jem."
              action={
                <span className="ops-badge">
                  <Brackets size={14} />
                  draft mode
                </span>
              }
            />

            <form className="form-grid organizer-form-grid">
              <label>
                <span>Naziv turnirja</span>
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
                <span>Zacetek</span>
                <input defaultValue="2026-05-20T19:00" type="datetime-local" />
              </label>
              <label>
                <span>Stevilo ekip</span>
                <input
                  defaultValue={registrationTournament?.teamsCount ?? 8}
                  min={2}
                  type="number"
                />
              </label>
              <label className="form-wide">
                <span>Opis</span>
                <textarea defaultValue={registrationTournament?.description ?? ""} rows={4} />
              </label>
              <div className="form-actions">
                <button className="button ops-button-secondary" type="button">
                  <Save size={18} />
                  <span>Shrani osnutek</span>
                </button>
                <button className="button ops-button-primary" type="button">
                  <Send size={18} />
                  <span>Objavi</span>
                </button>
              </div>
            </form>
          </section>

          <section className="organizer-command-panel ops-panel">
            <SectionHeader
              eyebrow="Workflow"
              title="Turnirski operativni tok"
              description="Od priprave turnirja do javne objave rezultatov in analitike."
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
          eyebrow="Plan izvedbe"
          title="Operativni razvojni/statusni plan"
          description="Sklep iz projektnega dokumenta, prikazan kot P1/P2/P3 roadmap za nadaljnji razvoj."
        />
        <PriorityRoadmap items={roadmap} />
      </section>
    </div>
  );
}
