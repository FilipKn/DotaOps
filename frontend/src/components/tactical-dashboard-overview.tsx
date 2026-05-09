import {
  Activity,
  DatabaseZap,
  Eye,
  Radar,
  ShieldCheck,
  Swords,
  Trophy,
  UsersRound
} from "lucide-react";
import Link from "next/link";

import { AnalyticsOverview } from "@/components/analytics-overview";
import { BracketView } from "@/components/bracket-view";
import { DashboardHero } from "@/components/dashboard-hero";
import { MatchImportPanel } from "@/components/match-import-panel";
import { MatchSchedule } from "@/components/match-schedule";
import { MetricCard } from "@/components/metric-card";
import { SectionHeader } from "@/components/section-header";
import { TacticalInsightCard } from "@/components/tactical-insight-card";
import { TournamentCard } from "@/components/tournament-card";
import {
  getAnalytics,
  getMatches,
  getTeams,
  getTournaments
} from "@/lib/data";
import { formatPercent } from "@/lib/utils";

export async function TacticalDashboardOverview() {
  const [analytics, matches, teams, tournaments] = await Promise.all([
    getAnalytics(),
    getMatches(),
    getTeams(),
    getTournaments()
  ]);
  const liveMatches = matches.filter(
    (match) => match.tournamentSlug === "ancient-cup-ljubljana"
  );
  const importedMatches = matches.filter((match) => match.dotaMatchId);
  const topTeams = [...teams].sort((a, b) => b.winRate - a.winRate).slice(0, 3);

  return (
    <div className="tactical-dashboard">
      <DashboardHero />

      <section className="dashboard-metrics" aria-label="Takticni povzetek">
        <MetricCard
          icon={Trophy}
          label="Aktivni turnirji"
          tone="red"
          trend="1 live, 1 v prijavah"
          value="3"
        />
        <MetricCard
          icon={UsersRound}
          label="Ekipe v sistemu"
          tone="teal"
          trend="profili pripravljeni"
          value="24"
        />
        <MetricCard
          icon={Swords}
          label="Tekme"
          tone="amber"
          trend="2 z uvozenim match_id"
          value="48"
        />
        <MetricCard
          icon={DatabaseZap}
          label="Analiticni tok"
          tone="green"
          trend="obdelava + agregati"
          value="P1"
        />
      </section>

      <section className="dashboard-command-grid">
        <div className="dashboard-panel dashboard-panel-main ops-panel">
          <SectionHeader
            eyebrow="Live matches"
            title="Razpored in rezultati"
            description="Operativni pregled tekem, statusov in povezav na Dota 2 match podatke."
            action={
              <Link className="text-link ops-mono" href="/turnirji/ancient-cup-ljubljana">
                <span>Podrobnosti</span>
              </Link>
            }
          />
          <MatchSchedule matches={liveMatches} />
        </div>

        <aside className="dashboard-side-stack">
          <div className="dashboard-panel ops-panel">
            <SectionHeader
              eyebrow="Tactical insights"
              title="Vpogledi"
              description="Hitri signali za organizatorja in ekipe."
            />
            <div className="tactical-insight-list">
              <TacticalInsightCard icon={Radar} title="Tekmovalni tok">
                Finalni sloti so pripravljeni za naslednji krog bracket faze.
              </TacticalInsightCard>
              <TacticalInsightCard icon={Eye} tone="cyan" title="Javni pogled">
                Razpored, rezultati in match_id statusi so usklajeni za gledalce.
              </TacticalInsightCard>
            </div>
          </div>

          <div className="dashboard-panel ops-panel">
            <SectionHeader
              eyebrow="Active teams"
              title="Ekipe"
              description="Najbolj stabilne ekipe po trenutnih metrikah."
            />
            <div className="dashboard-team-list">
              {topTeams.map((team) => (
                <article key={team.id}>
                  <span className="ops-signal" />
                  <div>
                    <strong>{team.name}</strong>
                    <p className="ops-mono">
                      {formatPercent(team.winRate)} win rate - KDA {team.kda.toFixed(1)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </aside>
      </section>

      <section className="dashboard-lower-grid">
        <div className="dashboard-panel ops-panel">
          <SectionHeader
            eyebrow="Bracket system"
            title="Turnirski tok"
            description="Napredovanje ekip za trenutni turnir."
          />
          <BracketView matches={liveMatches} />
        </div>

        <div className="dashboard-panel ops-panel">
          <SectionHeader
            eyebrow="Tournament circuits"
            title="Aktualni dogodki"
            description="Pregled turnirjev in statusov za operativno spremljanje."
          />
          <div className="dashboard-tournament-list">
            {tournaments.slice(0, 2).map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        </div>

        <div className="dashboard-panel ops-panel">
          <SectionHeader
            eyebrow="OpenDota pipeline"
            title="Uvoz podatkov"
            description={`${importedMatches.length} tekem ima povezan match_id.`}
          />
          <MatchImportPanel />
        </div>
      </section>

      <section className="dashboard-panel ops-panel dashboard-analytics-panel">
        <SectionHeader
          eyebrow="Analytics core"
          title="Ekipe, igralci in junaki"
          description="Pripravljena postavitev za KDA, win rate, najpogosteje igrane junake in primerjave."
          action={
            <Link className="text-link ops-mono" href="/analitika">
              <Activity size={16} />
              <span>Odpri analitiko</span>
            </Link>
          }
        />
        <AnalyticsOverview heroes={analytics.heroMetrics} teams={analytics.teams} />
      </section>

      <section className="dashboard-status-bar ops-panel">
        <div>
          <ShieldCheck size={18} />
          <span className="ops-label">System status</span>
          <strong className="ops-data">ONLINE</strong>
        </div>
        <div>
          <DatabaseZap size={18} />
          <span className="ops-label">Match sync</span>
          <strong className="ops-data">Fallback ready</strong>
        </div>
        <div>
          <Activity size={18} />
          <span className="ops-label">Telemetry</span>
          <strong className="ops-data">30s cache</strong>
        </div>
      </section>
    </div>
  );
}
