import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EnvRequired } from "@/components/env-required";
import { TasksTable } from "./tasks-table";
import type { Task } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TasksPage() {
  const supabase = createClient();
  if (!supabase) return <EnvRequired />;
  const { data } = await supabase
    .from("tasks")
    .select("*")
    .order("deadline", { ascending: true, nullsFirst: false });

  return (
    <div className="space-y-4">
      <PageHeader title="Задачи" />
      <TasksTable tasks={(data ?? []) as Task[]} />
    </div>
  );
}
