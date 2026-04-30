import { notFound } from "next/navigation";

import { AnalyticsOverview } from "@/components/analytics-overview";
import { BracketView } from "@/components/bracket-view";
import { MatchSchedule } from "@/components/match-schedule";
import { SectionHeader } from "@/components/section-header";
import { StatusBadge } from "@/components/status-badge";
import { heroMetrics, matches, teams, tournaments } from "@/lib/mock-data";
import { formatDateTime } from "@/lib/utils";

interface TournamentDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
}

export function generateStaticParams() {
  return tournaments.map((tournament) => ({ slug: tournament.slug }));
}

export default async function TournamentDetailPage({
  params
}: TournamentDetailPageProps) {
  const { slug } = await params;
  const tournament = tournaments.find((item) => item.slug === slug);

  if (!tournament) {
    notFound();
  }

  const tournamentMatches = matches.filter((match) => match.tournamentSlug === slug);

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Turnir</p>
          <h1>{tournament.title}</h1>
          <p>{tournament.description}</p>
          <div className="inline-meta">
            <span>{tournament.format}</span>
            <span>{formatDateTime(tournament.startsAt)}</span>
            <span>
              {tournament.registrationsCount}/{tournament.teamsCount} ekip
            </span>
          </div>
        </div>
        <StatusBadge status={tournament.status} />
      </section>

      <section className="content-grid">
        <div className="panel panel-large">
          <SectionHeader
            eyebrow="Tekme"
            title="Razpored, rezultati in match_id"
            description="Podlaga za javni pogled obiskovalcev in povezavo z internimi zapisi turnirja."
          />
          <MatchSchedule matches={tournamentMatches} />
        </div>

        <div className="panel">
          <SectionHeader
            eyebrow="Bracket"
            title="Napredovanje"
            description="Prikaz parov, rezultatov in naslednjih krogov."
          />
          <BracketView matches={tournamentMatches} />
        </div>
      </section>

      <section className="panel">
        <SectionHeader
          eyebrow="Turnirska analitika"
          title="Metrike po uvozenih tekmah"
          description="Pripravljeno za win rate, KDA, trajanje tekem in uspesnost junakov."
        />
        <AnalyticsOverview heroes={heroMetrics} teams={teams} />
      </section>
    </div>
  );
}
