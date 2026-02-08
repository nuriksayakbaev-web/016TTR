import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { Receipt } from "lucide-react";
import { formatMoney } from "@/lib/currency";
import { PageHeader } from "@/components/page-header";
import { DashboardTasks } from "./components/dashboard-tasks";
import type { Task } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = createClient();

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

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-card border border-border/80 bg-card p-5 shadow-card transition-shadow hover:shadow-card-hover">
          <p className="text-sm font-medium text-muted-foreground">Доходы</p>
          <p className="mt-1 text-2xl font-semibold text-emerald-600">
            {formatMoney(income)}
          </p>
        </div>
        <div className="rounded-card border border-border/80 bg-card p-5 shadow-card transition-shadow hover:shadow-card-hover">
          <p className="text-sm font-medium text-muted-foreground">Расходы</p>
          <p className="mt-1 text-2xl font-semibold text-rose-600">
            {formatMoney(expense)}
          </p>
        </div>
        <div className="rounded-card border border-border/80 bg-card p-5 shadow-card transition-shadow hover:shadow-card-hover">
          <p className="text-sm font-medium text-muted-foreground">Счета не оплачены</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {formatMoney(unpaid)}
          </p>
          <Link
            href="/finances/invoices?filter=unpaid"
            className="mt-2 flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            <Receipt className="h-4 w-4" /> К счетам
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        <DashboardTasks urgentTasks={urgentTasks} upcomingTasks={upcomingTasks} />
      </div>
    </div>
  );
}
