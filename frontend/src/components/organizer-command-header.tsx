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
        <h1>Organizatorski command center</h1>
        <p className="ops-mono">
          Delovni prostor za turnirje, prijave ekip, rezultate, bracket in
          OpenDota match_id podatkovni tok.
        </p>
      </div>

      <div className="organizer-command-status">
        <article>
          <Trophy size={18} />
          <span className="ops-label">Turnirji</span>
          <strong className="ops-data">{tournamentCount}</strong>
        </article>
        <article>
          <Brackets size={18} />
          <span className="ops-label">Prijave</span>
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
