"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Receipt } from "lucide-react";
import { formatMoney } from "@/lib/currency";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/lib/toast";

interface DashboardStatsProps {
  income: number;
  expense: number;
  unpaid: number;
}

export function DashboardStats({ income, expense, unpaid }: DashboardStatsProps) {
  const pathname = usePathname();
  const toast = useToast();
  const supabase = createClient();
  const [localIncome, setLocalIncome] = useState(income);
  const [localExpense, setLocalExpense] = useState(expense);
  const [localUnpaid, setLocalUnpaid] = useState(unpaid);

  useEffect(() => {
    setLocalIncome(income);
    setLocalExpense(expense);
    setLocalUnpaid(unpaid);
  }, [income, expense, unpaid]);

  useEffect(() => {
    if (!supabase || pathname !== "/") return;
    Promise.all([
      supabase.from("transactions").select("amount").eq("type", "income"),
      supabase.from("transactions").select("amount").eq("type", "expense"),
      supabase
        .from("invoices")
        .select("amount")
        .in("status", ["draft", "sent", "overdue"]),
    ]).then(([incomeRes, expenseRes, unpaidRes]) => {
      if (incomeRes.error || expenseRes.error || unpaidRes.error) {
        toast.error(
          incomeRes.error?.message ||
            expenseRes.error?.message ||
            unpaidRes.error?.message ||
            "Ошибка загрузки данных дашборда"
        );
        return;
      }
      const sumIncome = (incomeRes.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
      const sumExpense = (expenseRes.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
      const sumUnpaid = (unpaidRes.data ?? []).reduce((s, r) => s + Number(r.amount), 0);
      setLocalIncome(sumIncome);
      setLocalExpense(sumExpense);
      setLocalUnpaid(sumUnpaid);
    });
  }, [pathname, supabase, toast]);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-card border border-border/80 bg-card p-5 shadow-card transition-shadow hover:shadow-card-hover">
        <p className="text-sm font-medium text-muted-foreground">Доходы</p>
        <p className="mt-1 text-2xl font-semibold text-emerald-600">
          {formatMoney(localIncome)}
        </p>
      </div>
      <div className="rounded-card border border-border/80 bg-card p-5 shadow-card transition-shadow hover:shadow-card-hover">
        <p className="text-sm font-medium text-muted-foreground">Расходы</p>
        <p className="mt-1 text-2xl font-semibold text-rose-600">
          {formatMoney(localExpense)}
        </p>
      </div>
      <div className="rounded-card border border-border/80 bg-card p-5 shadow-card transition-shadow hover:shadow-card-hover">
        <p className="text-sm font-medium text-muted-foreground">Счета не оплачены</p>
        <p className="mt-1 text-2xl font-semibold text-foreground">
          {formatMoney(localUnpaid)}
        </p>
        <Link
          href="/finances/invoices?filter=unpaid"
          className="mt-2 flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <Receipt className="h-4 w-4" /> К счетам
        </Link>
      </div>
    </div>
  );
}
