import { SectionHeader } from "@/components/section-header";
import { TeamCommandHeader } from "@/components/team-command-header";
import { TeamPerformanceCard } from "@/components/team-performance-card";
import { TeamRosterGrid } from "@/components/team-roster-grid";
import { TeamStatusPanel } from "@/components/team-status-panel";
import { TeamTable } from "@/components/team-table";
import { getTeams } from "@/lib/data";

export default async function TeamsPage() {
  const teams = await getTeams();
  const rankedTeams = [...teams].sort((a, b) => b.winRate - a.winRate);

  return (
    <div className="team-command">
      <TeamCommandHeader teams={teams} />

      <section className="team-command-grid">
        <div className="team-command-main">
          <section className="team-command-panel ops-panel">
            <SectionHeader
              eyebrow="Tactical roster grid"
              title="Ekipe"
              description="Pregled kapetanov, regij, win rate, KDA in osnovnega hero poola za vsako ekipo."
            />
            <div className="team-performance-grid">
              {rankedTeams.map((team, index) => (
                <TeamPerformanceCard
                  key={team.id}
                  rank={index + 1}
                  team={team}
                />
              ))}
            </div>
          </section>

          <section className="team-command-panel team-table-panel ops-panel">
            <SectionHeader
              eyebrow="Roster registry"
              title="Podatkovna tabela"
              description="Tabela ostaja pripravljena za filtre, Steam povezave in zgodovino nastopov."
            />
            <TeamTable teams={rankedTeams} />
          </section>
        </div>

        <TeamStatusPanel teams={teams} />
      </section>

      <section className="team-command-panel ops-panel">
        <SectionHeader
          eyebrow="Player assignments"
          title="Rosterji in vloge"
          description="Operativni pregled igralcev, vlog, najljubsih junakov in KDA signala po ekipah."
        />
        <TeamRosterGrid teams={rankedTeams} />
      </section>
    </div>
  );
}
