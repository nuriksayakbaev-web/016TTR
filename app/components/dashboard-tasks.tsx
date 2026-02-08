"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { ListTodo, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import { updateRow } from "@/lib/supabaseService";
import { useToast } from "@/lib/toast";
import type { Task } from "@/lib/types";

interface DashboardTasksProps {
  urgentTasks: Task[];
  upcomingTasks: Task[];
}

export function DashboardTasks({ urgentTasks, upcomingTasks }: DashboardTasksProps) {
  const pathname = usePathname();
  const toast = useToast();
  const supabase = createClient();
  const [localUrgent, setLocalUrgent] = useState<Task[]>(urgentTasks);
  const [localUpcoming, setLocalUpcoming] = useState<Task[]>(upcomingTasks);

  useEffect(() => {
    setLocalUrgent(urgentTasks);
    setLocalUpcoming(upcomingTasks);
  }, [urgentTasks, upcomingTasks]);

  async function fetchTasks() {
    if (!supabase) return;
    const [urgentRes, upcomingRes] = await Promise.all([
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
    if (urgentRes.error || upcomingRes.error) {
      toast.error(
        urgentRes.error?.message ||
          upcomingRes.error?.message ||
          "Ошибка загрузки задач"
      );
      return;
    }
    const urgent = (urgentRes.data ?? []).map((r) => ({
      ...r,
      is_urgent: Boolean(r.is_urgent),
    })) as Task[];
    const upcoming = (upcomingRes.data ?? []).map((r) => ({
      ...r,
      is_urgent: Boolean(r.is_urgent),
    })) as Task[];
    setLocalUrgent(urgent);
    setLocalUpcoming(upcoming);
  }

  useEffect(() => {
    if (pathname !== "/") return;
    void fetchTasks();
  }, [pathname, supabase]);

  async function toggleUrgent(task: Task) {
    if (!supabase) return;
    const { error } = await updateRow(supabase, "tasks", task.id, {
      is_urgent: !task.is_urgent,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(task.is_urgent ? "Снято со срочных" : "Отмечено как срочная");
    await fetchTasks();
  }

  function TaskRow({
    t,
    showUrgentToggle,
  }: {
    t: Task;
    showUrgentToggle: boolean;
  }) {
    return (
      <div className="flex items-center justify-between gap-3 px-5 py-3.5 transition-colors hover:bg-muted/30">
        <Link href="/tasks" className="min-w-0 flex-1">
          <span className={`font-medium ${t.is_urgent ? "text-amber-700" : "text-foreground"}`}>
            {t.title}
          </span>
          <span className="ml-2 text-sm text-muted-foreground">
            {t.deadline
              ? new Date(t.deadline).toLocaleDateString("ru-RU")
              : "—"}
          </span>
        </Link>
        {showUrgentToggle && (
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0"
            onClick={(e) => {
              e.preventDefault();
              toggleUrgent(t);
            }}
            title={t.is_urgent ? "Убрать из срочных" : "Отметить срочной"}
          >
            <Star
              className={`h-4 w-4 ${t.is_urgent ? "fill-amber-500 text-amber-500" : "text-muted-foreground"}`}
            />
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      {localUrgent.length > 0 && (
        <div className="rounded-card border border-amber-200/80 bg-amber-50/50 shadow-card overflow-hidden dark:border-amber-900/40 dark:bg-amber-950/20">
          <div className="border-b border-amber-200/80 bg-amber-100/50 px-5 py-3 font-medium text-amber-900 dark:border-amber-900/40 dark:bg-amber-900/30 dark:text-amber-100">
            Срочные задачи
          </div>
          <div className="divide-y divide-amber-200/60 dark:divide-amber-900/30">
            {localUrgent.map((t) => (
              <TaskRow key={t.id} t={t} showUrgentToggle />
            ))}
          </div>
          <Link
            href="/tasks"
            className="flex items-center gap-1.5 border-t border-amber-200/80 bg-amber-100/30 px-5 py-3 text-sm font-medium text-amber-800 transition-colors hover:bg-amber-100/50 dark:border-amber-900/40 dark:bg-amber-900/20 dark:text-amber-200 dark:hover:bg-amber-900/30"
          >
            <ListTodo className="h-4 w-4" /> Все задачи
          </Link>
        </div>
      )}

      <div className="rounded-card border border-border/80 bg-card shadow-card overflow-hidden">
        <div className="border-b border-border/60 bg-muted/40 px-5 py-3 font-medium text-foreground">
          Ближайшие задачи
        </div>
        <div className="divide-y divide-border/60">
          {localUpcoming.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              Нет активных задач
            </div>
          ) : (
            localUpcoming.map((t) => (
              <TaskRow key={t.id} t={t} showUrgentToggle />
            ))
          )}
        </div>
        <Link
          href="/tasks"
          className="flex items-center gap-1.5 border-t border-border/60 bg-muted/20 px-5 py-3 text-sm font-medium text-primary transition-colors hover:bg-muted/40"
        >
          <ListTodo className="h-4 w-4" /> Все задачи
        </Link>
      </div>
    </>
  );
}
