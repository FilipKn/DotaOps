import { Plus } from "lucide-react";
import Link from "next/link";

import { SectionHeader } from "@/components/section-header";
import { TournamentCard } from "@/components/tournament-card";
import { tournaments } from "@/lib/mock-data";

export default function TournamentsPage() {
  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="eyebrow">Turnirji</p>
          <h1>Pregled turnirjev</h1>
          <p>
            Javni in organizatorski pregled statusov, prijav, formatov ter
            zacetnih podatkov za Dota 2 turnirje.
          </p>
        </div>
        <Link className="button button-primary" href="/organizator">
          <Plus size={18} />
          <span>Nov turnir</span>
        </Link>
      </section>

      <section className="panel">
        <SectionHeader
          eyebrow="Seznam"
          title="Vsi turnirji"
          description="Statusi so pripravljeni za objavo, prijave, live potek in arhiv."
        />
        <div className="cards-grid">
          {tournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      </section>
    </div>
  );
}
