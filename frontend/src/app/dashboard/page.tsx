import { RoleDashboard } from "@/components/dashboard/role-dashboard";
import { normalizeDashboardRole } from "@/lib/role-dashboard-data";

interface DashboardPageProps {
  searchParams?: Promise<{
    role?: string | string[];
  }>;
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams;
  const role = normalizeDashboardRole(params?.role);

  return <RoleDashboard role={role} />;
}
