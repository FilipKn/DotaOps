import { CaptainDashboardView } from "@/components/dashboard/captain-dashboard-view";
import { OrganizerDashboardView } from "@/components/dashboard/organizer-dashboard-view";
import { PlayerDashboardView } from "@/components/dashboard/player-dashboard-view";
import { PublicDashboardGate } from "@/components/dashboard/public-dashboard-gate";
import type { DashboardRole } from "@/lib/role-dashboard-data";

export function RoleDashboard({ role }: { role: DashboardRole }) {
  if (role === "player") {
    return <PlayerDashboardView />;
  }

  if (role === "organizer") {
    return <OrganizerDashboardView />;
  }

  if (role === "public") {
    return <PublicDashboardGate />;
  }

  return <CaptainDashboardView />;
}
