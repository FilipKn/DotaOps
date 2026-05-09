import { Activity, ShieldCheck, Swords, UsersRound } from "lucide-react";

import type { Team } from "@/lib/types";
import { formatPercent } from "@/lib/utils";

interface TeamCommandHeaderProps {
  teams: Team[];
}

export function TeamCommandHeader({ teams }: TeamCommandHeaderProps) {
  const topTeam = [...teams].sort((a, b) => b.winRate - a.winRate)[0];
  const totalPlayers = teams.reduce((total, team) => total + team.roster.length, 0);
  const avgWinRate =
    teams.reduce((total, team) => total + team.winRate, 0) /
    Math.max(teams.length, 1);

  return (
    <section className="team-command-header ops-panel ops-command-grid">
      <div className="team-command-copy">
        <p className="ops-label">Team operations</p>
        <h1>Ekipni command center</h1>
        <p className="ops-mono">
          Operativni pregled rosterjev, kapetanov, regij in tekmovalnih metrik
          za Dota 2 ekipe.
        </p>
      </div>

      <div className="team-command-status">
        <article>
          <ShieldCheck size={18} />
          <span className="ops-label">Aktivne ekipe</span>
          <strong className="ops-data">{teams.length}</strong>
        </article>
        <article>
          <UsersRound size={18} />
          <span className="ops-label">Igralci</span>
          <strong className="ops-data">{totalPlayers}</strong>
        </article>
        <article>
          <Activity size={18} />
          <span className="ops-label">Avg win rate</span>
          <strong className="ops-data">{formatPercent(avgWinRate)}</strong>
        </article>
        <article>
          <Swords size={18} />
          <span className="ops-label">Top team</span>
          <strong className="ops-data">{topTeam?.name ?? "N/A"}</strong>
        </article>
      </div>
    </section>
  );
}
