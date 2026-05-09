import { CalendarDays, GitBranch, Plus, ShieldCheck, UsersRound } from "lucide-react";
import Link from "next/link";

import { SectionHeader } from "@/components/section-header";
import { TournamentCommandHeader } from "@/components/tournament-command-header";
import { TournamentCard } from "@/components/tournament-card";
import { TournamentMetaGrid } from "@/components/tournament-meta-grid";
import { getTournaments } from "@/lib/data";

export default async function TournamentsPage() {
  const tournaments = await getTournaments();
  const liveTournaments = tournaments.filter((tournament) => tournament.status === "live").length;
  const openRegistrations = tournaments.filter(
    (tournament) => tournament.status === "registration"
  ).length;
  const totalRegistrations = tournaments.reduce(
    (total, tournament) => total + tournament.registrationsCount,
    0
  );
  const totalSlots = tournaments.reduce(
    (total, tournament) => total + tournament.teamsCount,
    0
  );

  return (
    <div className="tournament-command">
      <TournamentCommandHeader
        eyebrow="Tournament operations"
        title="Turnirski command center"
        description="Javni in organizatorski pregled statusov, prijav, formatov ter zacetnih podatkov za Dota 2 turnirje."
        actions={
          <Link className="button ops-button-primary" href="/organizator">
            <Plus size={18} />
            <span>Nov turnir</span>
          </Link>
        }
      >
        <TournamentMetaGrid
          items={[
            {
              detail: "vsi circuits",
              icon: ShieldCheck,
              label: "Turnirji",
              tone: "red",
              value: String(tournaments.length)
            },
            {
              detail: "trenutno aktivni",
              icon: GitBranch,
              label: "Live",
              tone: "green",
              value: String(liveTournaments)
            },
            {
              detail: `${totalRegistrations}/${totalSlots} ekip`,
              icon: UsersRound,
              label: "Prijave",
              tone: "cyan",
              value: String(openRegistrations)
            },
            {
              detail: "operativni koledar",
              icon: CalendarDays,
              label: "Razpored",
              tone: "gold",
              value: "SYNC"
            }
          ]}
        />
      </TournamentCommandHeader>

      <section className="tournament-command-panel ops-panel">
        <SectionHeader
          eyebrow="Tournament registry"
          title="Vsi turnirji"
          description="Statusi, prijave, ekipe in format so pripravljeni za operativni pregled."
        />
        <div className="tournament-card-grid">
          {tournaments.map((tournament) => (
            <TournamentCard key={tournament.id} tournament={tournament} />
          ))}
        </div>
      </section>
    </div>
  );
}
