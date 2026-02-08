import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { NotesTable } from "./notes-table";
import type { Note } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NotesPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("notes")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <PageHeader title="Заметки" />
      <NotesTable notes={(data ?? []) as Note[]} />
    </div>
  );
}
