import { CalendarDays, ChevronRight, UsersRound } from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/status-badge";
import type { Tournament } from "@/lib/types";
import { formatDateTime } from "@/lib/utils";

export function TournamentCard({ tournament }: { tournament: Tournament }) {
  return (
    <article className="tournament-card">
      <div className="card-title-row">
        <div>
          <h3>{tournament.title}</h3>
          <p>{tournament.format}</p>
        </div>
        <StatusBadge status={tournament.status} />
      </div>

      <p className="card-description">{tournament.description}</p>

      <div className="card-meta-grid">
        <span>
          <CalendarDays size={16} />
          {formatDateTime(tournament.startsAt)}
        </span>
        <span>
          <UsersRound size={16} />
          {tournament.registrationsCount}/{tournament.teamsCount} ekip
        </span>
      </div>

      <Link className="text-link" href={`/turnirji/${tournament.slug}`}>
        <span>Odpri turnir</span>
        <ChevronRight size={16} />
      </Link>
    </article>
  );
}
