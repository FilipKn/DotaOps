import {
  Activity,
  DatabaseZap,
  Swords,
  Trophy,
  UsersRound
} from "lucide-react";
import Link from "next/link";

import { AnalyticsOverview } from "@/components/analytics-overview";
import { BracketView } from "@/components/bracket-view";
import { MatchImportPanel } from "@/components/match-import-panel";
import { MatchSchedule } from "@/components/match-schedule";
import { MetricCard } from "@/components/metric-card";
import { SectionHeader } from "@/components/section-header";
import { TournamentCard } from "@/components/tournament-card";
import { heroMetrics, matches, teams, tournaments } from "@/lib/mock-data";

export default function Home() {
  const liveMatches = matches.filter(
    (match) => match.tournamentSlug === "ancient-cup-ljubljana"
  );

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">DotaOps</p>
          <h1>Operativna plosca za Dota 2 turnirje</h1>
          <p>
            Enotno mesto za turnirje, prijave ekip, rezultate, bracket,
            match_id tok in osnovno analitiko igralcev, ekip ter junakov.
          </p>
        </div>
        <div className="header-actions">
          <Link className="button button-primary" href="/turnirji">
            <Trophy size={18} />
            <span>Preglej turnirje</span>
          </Link>
          <Link className="button button-secondary" href="/analitika">
            <Activity size={18} />
            <span>Odpri analitiko</span>
          </Link>
        </div>
      </section>

      <section className="metric-grid" aria-label="Povzetek">
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

      <section className="content-grid">
        <div className="panel panel-large">
          <SectionHeader
            eyebrow="Javni pregled"
            title="Razpored in rezultati"
            description="Osnovni prikaz tekem, statusov in povezav na Dota 2 match podatke."
            action={
              <Link className="text-link" href="/turnirji/ancient-cup-ljubljana">
                <span>Podrobnosti</span>
              </Link>
            }
          />
          <MatchSchedule matches={liveMatches} />
        </div>

        <div className="panel">
          <SectionHeader
            eyebrow="Turnirski tok"
            title="Bracket"
            description="Napredovanje ekip za trenutni turnir."
          />
          <BracketView matches={liveMatches} />
        </div>
      </section>

      <section className="two-column">
        <div className="panel">
          <SectionHeader
            eyebrow="Turnirji"
            title="Aktualni dogodki"
            description="Zacetni pregled za organizatorje, ekipe in obiskovalce."
          />
          <div className="cards-grid compact">
            {tournaments.slice(0, 2).map((tournament) => (
              <TournamentCard key={tournament.id} tournament={tournament} />
            ))}
          </div>
        </div>

        <MatchImportPanel />
      </section>

      <div className="panel">
        <SectionHeader
          eyebrow="Analitika"
          title="Ekipe, igralci in junaki"
          description="Pripravljena postavitev za KDA, win rate, najpogosteje igrane junake in primerjave."
        />
        <AnalyticsOverview heroes={heroMetrics} teams={teams} />
      </div>
    </div>
  );
}
