import { RoleDashboard } from "@/components/dashboard/role-dashboard";
import { normalizeDashboardRole } from "@/lib/role-dashboard-data";

interface DashboardPageProps {
  searchParams?: Promise<{
    role?: string | string[];
  }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const role = params?.role ? normalizeDashboardRole(params.role) : undefined;

  return <RoleDashboard role={role} />;
}
