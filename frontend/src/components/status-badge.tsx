import type { ImportStatus, MatchStatus, TournamentStatus } from "@/lib/types";
import { classNames } from "@/lib/utils";

type Status = TournamentStatus | MatchStatus | ImportStatus;

const labels: Record<Status, string> = {
  draft: "Osnutek",
  registration: "Prijave",
  published: "Objavljeno",
  live: "V teku",
  finished: "Zakljuceno",
  scheduled: "Planirano",
  ready: "Pripravljeno",
  processing: "V obdelavi",
  error: "Napaka",
  idle: "Caka"
};

export function StatusBadge({ status }: { status: Status }) {
  return (
    <span className={classNames("status-badge", `status-${status}`)}>
      {labels[status]}
    </span>
  );
}
