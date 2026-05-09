import {
  Activity,
  BarChart3,
  Clock3,
  DatabaseZap,
  GitCompare,
  Percent,
  ShieldCheck,
  Swords
} from "lucide-react";

import { AnalyticsTerminalHeader } from "@/components/analytics-terminal-header";
import { ComparisonPanel } from "@/components/comparison-panel";
import { HeroPerformanceGrid } from "@/components/hero-performance-grid";
import { SectionHeader } from "@/components/section-header";
import { StatusBadge } from "@/components/status-badge";
import { TeamTable } from "@/components/team-table";
import { TelemetryCard } from "@/components/telemetry-card";
import { getAnalytics, getMatches } from "@/lib/data";
import { formatPercent } from "@/lib/utils";

export default async function AnalyticsPage() {
  const [analytics, matches] = await Promise.all([
    getAnalytics(),
    getMatches()
  ]);
  const imported = matches.filter((match) => match.dotaMatchId);
  const topHero = [...analytics.heroMetrics].sort((a, b) => b.winRate - a.winRate)[0] ?? {
    avgKda: 0,
    hero: "N/A",
    pickRate: 0,
    winRate: 0
  };
  const topTeam = [...analytics.teams].sort((a, b) => b.winRate - a.winRate)[0] ?? {
    captain: "N/A",
    favoriteHeroes: [],
    id: "empty",
    kda: 0,
    lastFive: [],
    name: "N/A",
    region: "N/A",
    roster: [],
    winRate: 0
  };
  const teamCount = Math.max(analytics.teams.length, 1);
  const heroCount = Math.max(analytics.heroMetrics.length, 1);
  const matchCount = Math.max(matches.length, 1);
  const avgWinRate =
    analytics.teams.reduce((total, team) => total + team.winRate, 0) /
    teamCount;
  const avgKda =
    analytics.teams.reduce((total, team) => total + team.kda, 0) /
    teamCount;
  const heroSuccess =
    analytics.heroMetrics.reduce((total, hero) => total + hero.winRate, 0) /
    heroCount;
  const avgDuration = `${32 + imported.length}:40`;

  return (
    <div className="analytics-terminal">
      <AnalyticsTerminalHeader
        importedMatches={imported.length}
        totalMatches={matches.length}
        topHero={topHero.hero}
        topTeam={topTeam.name}
      />

      <section className="analytics-telemetry-grid">
        <TelemetryCard
          icon={Percent}
          label="Avg win rate"
          value={formatPercent(avgWinRate)}
          delta={`${topTeam.name} leads`}
          tone="cyan"
        />
        <TelemetryCard
          icon={Swords}
          label="Avg KDA"
          value={avgKda.toFixed(1)}
          delta="team model"
          tone="gold"
        />
        <TelemetryCard
          icon={Clock3}
          label="Avg duration"
          value={avgDuration}
          delta="match window"
          tone="green"
        />
        <TelemetryCard
          icon={BarChart3}
          label="Hero success"
          value={formatPercent(heroSuccess)}
          delta={`${topHero.hero} top pick`}
          tone="red"
        />
      </section>

      <section className="analytics-terminal-grid">
        <div className="analytics-terminal-panel analytics-performance-panel ops-panel">
          <SectionHeader
            eyebrow="Performance telemetry"
            title="Win Rate, KDA, and Match Tempo"
            description="Terminal view for monitoring OpenDota signals, comparisons, and variance across the match flow."
          />

          <div className="analytics-chart" aria-hidden="true">
            <svg viewBox="0 0 800 240" role="img">
              <path
                d="M0 185 L90 176 L180 188 L270 152 L360 164 L450 118 L540 129 L630 88 L720 96 L800 72"
                fill="none"
                stroke="var(--ops-primary)"
                strokeWidth="3"
              />
              <path
                d="M0 205 L90 196 L180 170 L270 179 L360 132 L450 139 L540 94 L630 102 L720 67 L800 54"
                fill="none"
                stroke="var(--ops-cyan)"
                strokeDasharray="7 8"
                strokeWidth="3"
              />
              <path
                d="M0 185 L90 176 L180 188 L270 152 L360 164 L450 118 L540 129 L630 88 L720 96 L800 72 L800 240 L0 240 Z"
                fill="rgba(255, 84, 78, 0.12)"
              />
            </svg>
          </div>

          <div className="analytics-chart-axis ops-mono">
            <span>START</span>
            <span>10:00</span>
            <span>20:00</span>
            <span>30:00</span>
            <span>END</span>
          </div>
        </div>

        <aside className="analytics-terminal-panel analytics-import-panel ops-panel">
          <SectionHeader
            eyebrow="OpenDota pipeline"
            title="Import Status"
            description="Match_id records that feed the analytics panels."
          />

          <div className="analytics-import-list">
            {imported.map((match) => (
              <article key={match.id}>
                <DatabaseZap size={18} />
                <div>
                  <strong>{match.dotaMatchId}</strong>
                  <p>
                    {match.teamA} vs {match.teamB}
                  </p>
                </div>
                <StatusBadge status={match.importStatus ?? "idle"} />
              </article>
            ))}
          </div>

          <div className="analytics-import-summary">
            <span className="ops-label">Fallback status</span>
            <strong className="ops-data">READY</strong>
          </div>
        </aside>
      </section>

      <section className="analytics-terminal-panel ops-panel">
        <SectionHeader
          eyebrow="Hero specialization"
          title="Hero Performance"
          description="Overview of win rate, pick rate, and KDA signals for key hero metrics."
        />
        <HeroPerformanceGrid heroes={analytics.heroMetrics} />
      </section>

      <section className="analytics-terminal-grid analytics-terminal-grid-secondary">
        <div className="analytics-terminal-panel ops-panel">
          <SectionHeader
            eyebrow="Team comparison"
            title="Team Comparisons"
            description="Team ranking based on current win rate and KDA signals."
            action={
              <span className="ops-badge">
                <GitCompare size={14} />
                compare
              </span>
            }
          />
          <ComparisonPanel teams={analytics.teams} />
        </div>

        <div className="analytics-terminal-panel ops-panel">
          <SectionHeader
            eyebrow="Telemetry status"
            title="Analytics Signals"
            description="Fast data quality overview for the tournament organizer."
          />
          <div className="analytics-signal-list">
            <article>
              <ShieldCheck size={18} />
              <span className="ops-label">Import coverage</span>
              <strong className="ops-data">
                {formatPercent((imported.length / matchCount) * 100)}
              </strong>
            </article>
            <article>
              <Activity size={18} />
              <span className="ops-label">Active comparisons</span>
              <strong className="ops-data">{analytics.teams.length}</strong>
            </article>
            <article>
              <BarChart3 size={18} />
              <span className="ops-label">Hero pool</span>
              <strong className="ops-data">{analytics.heroMetrics.length}</strong>
            </article>
          </div>
        </div>
      </section>

      <section className="analytics-terminal-panel analytics-table-panel ops-panel">
        <SectionHeader
          eyebrow="Roster data"
          title="Teams and Player Profiles"
          description="The table remains functional and uses existing team data."
        />
        <TeamTable teams={analytics.teams} />
      </section>
    </div>
  );
}
