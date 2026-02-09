import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EnvRequired } from "@/components/env-required";
import { DashboardTasks } from "./components/dashboard-tasks";
import { DashboardStats } from "./components/dashboard-stats";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  if (!supabase) return <EnvRequired />;

  return (
    <div className="space-y-6">
      <PageHeader title="Дашборд" />

      <DashboardStats income={0} expense={0} unpaid={0} />

      <div className="space-y-4">
        <DashboardTasks urgentTasks={[]} upcomingTasks={[]} />
      </div>
    </div>
  );
}
