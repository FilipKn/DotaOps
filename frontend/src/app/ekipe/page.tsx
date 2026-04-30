import { ShieldCheck } from "lucide-react";

import { SectionHeader } from "@/components/section-header";
import { TeamTable } from "@/components/team-table";
import { teams } from "@/lib/mock-data";
import { formatPercent } from "@/lib/utils";

export default function TeamsPage() {
  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Ekipe in igralci</p>
          <h1>Profili ekip</h1>
          <p>
            Osnovni javni pregled rosterjev, kapetanov, zgodovine nastopov in
            primerljivih metrik uspesnosti.
          </p>
        </div>
      </section>

      <section className="panel">
        <SectionHeader
          eyebrow="Seznam"
          title="Ekipe"
          description="Tabela je pripravljena za filtre, Steam povezave in zgodovino nastopov."
        />
        <TeamTable teams={teams} />
      </section>

      <section className="cards-grid">
        {teams.map((team) => (
          <article className="team-profile-card" key={team.id}>
            <div className="card-title-row">
              <div>
                <p className="eyebrow">{team.region}</p>
                <h3>{team.name}</h3>
              </div>
              <ShieldCheck size={22} />
            </div>
            <div className="profile-stats">
              <span>
                <strong>{formatPercent(team.winRate)}</strong>
                Win rate
              </span>
              <span>
                <strong>{team.kda.toFixed(1)}</strong>
                KDA
              </span>
            </div>
            <div className="roster-list">
              {team.roster.map((player) => (
                <div key={player.id}>
                  <strong>{player.nickname}</strong>
                  <span>
                    {player.role} · {player.favoriteHero}
                  </span>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
