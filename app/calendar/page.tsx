import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EnvRequired } from "@/components/env-required";
import { CalendarTable } from "./calendar-table";
import type { CalendarEvent } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function CalendarPage() {
  const supabase = createClient();
  if (!supabase) return <EnvRequired />;
  const { data } = await supabase
    .from("calendar_events")
    .select("*")
    .order("date", { ascending: true });

  return (
    <div className="space-y-4">
      <PageHeader title="Календарь" />
      <CalendarTable events={(data ?? []) as CalendarEvent[]} />
    </div>
  );
}
