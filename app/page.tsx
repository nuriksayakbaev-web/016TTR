import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EnvRequired } from "@/components/env-required";
import { DashboardTasks } from "./components/dashboard-tasks";
import { DashboardStats } from "./components/dashboard-stats";
import type { Task } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();
  if (!supabase) return <EnvRequired />;

  const [incomeRes, expenseRes, unpaidRes, urgentRes, upcomingRes] = await Promise.all([
    supabase.from("transactions").select("amount").eq("type", "income"),
    supabase.from("transactions").select("amount").eq("type", "expense"),
    supabase
      .from("invoices")
      .select("amount")
      .in("status", ["draft", "sent", "overdue"]),
    supabase
      .from("tasks")
      .select("id, title, deadline, status, is_urgent")
      .in("status", ["todo", "in_progress"])
      .eq("is_urgent", true)
      .order("deadline", { ascending: true, nullsFirst: false }),
    supabase
      .from("tasks")
      .select("id, title, deadline, status, is_urgent")
      .in("status", ["todo", "in_progress"])
      .order("deadline", { ascending: true, nullsFirst: false })
      .limit(5),
  ]);

  const income = (incomeRes.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const expense = (expenseRes.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const unpaid = (unpaidRes.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
  const urgentTasks = (urgentRes.data ?? []).map((r) => ({
    ...r,
    is_urgent: Boolean(r.is_urgent),
  })) as Task[];
  const upcomingTasks = (upcomingRes.data ?? []).map((r) => ({
    ...r,
    is_urgent: Boolean(r.is_urgent),
  })) as Task[];

  return (
    <div className="space-y-6">
      <PageHeader title="Дашборд" />

      <DashboardStats income={income} expense={expense} unpaid={unpaid} />

      <div className="space-y-4">
        <DashboardTasks urgentTasks={urgentTasks} upcomingTasks={upcomingTasks} />
      </div>
    </div>
  );
}
