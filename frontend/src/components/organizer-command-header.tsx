import { Brackets, DatabaseZap, RadioTower, Trophy } from "lucide-react";

interface OrganizerCommandHeaderProps {
  tournamentCount: number;
  registrationCount: number;
  importedMatches: number;
  activeRoadmapItems: number;
}

export function OrganizerCommandHeader({
  tournamentCount,
  registrationCount,
  importedMatches,
  activeRoadmapItems
}: OrganizerCommandHeaderProps) {
  return (
    <section className="organizer-command-header ops-panel ops-command-grid">
      <div className="organizer-command-copy">
        <p className="ops-label">Organizer operations</p>
        <h1>Organizer Command Center</h1>
        <p className="ops-mono">
          Workspace for tournaments, team registrations, results, brackets, and
          OpenDota match_id data flow.
        </p>
      </div>

      <div className="organizer-command-status">
        <article>
          <Trophy size={18} />
          <span className="ops-label">Tournaments</span>
          <strong className="ops-data">{tournamentCount}</strong>
        </article>
        <article>
          <Brackets size={18} />
          <span className="ops-label">Registrations</span>
          <strong className="ops-data">{registrationCount}</strong>
        </article>
        <article>
          <DatabaseZap size={18} />
          <span className="ops-label">Match_id</span>
          <strong className="ops-data">{importedMatches}</strong>
        </article>
        <article>
          <RadioTower size={18} />
          <span className="ops-label">Roadmap active</span>
          <strong className="ops-data">{activeRoadmapItems}</strong>
        </article>
      </div>
    </section>
  );
}
