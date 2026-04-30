import { DatabaseZap } from "lucide-react";

import { AnalyticsOverview } from "@/components/analytics-overview";
import { SectionHeader } from "@/components/section-header";
import { StatusBadge } from "@/components/status-badge";
import { heroMetrics, matches, teams } from "@/lib/mock-data";

export default function AnalyticsPage() {
  const imported = matches.filter((match) => match.dotaMatchId);

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Analitika</p>
          <h1>Dashboard za match podatke</h1>
          <p>
            Pregled metrik za igralce, ekipe, junake in turnirje na osnovi
            uvozenih match_id zapisov.
          </p>
        </div>
      </section>

      <section className="panel">
        <SectionHeader
          eyebrow="Metrike"
          title="KDA, win rate in uspesnost junakov"
          description="Zacetni UI za grafe, primerjave in filtre po vlogah."
        />
        <AnalyticsOverview heroes={heroMetrics} teams={teams} />
      </section>

      <section className="panel">
        <SectionHeader
          eyebrow="Podatkovni tok"
          title="Stanja uvoza"
          description="Stanja so poravnana z zahtevami: v obdelavi, pripravljeno in napaka."
        />
        <div className="import-status-grid">
          {imported.map((match) => (
            <article className="import-status-card" key={match.id}>
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
      </section>
    </div>
  );
}
