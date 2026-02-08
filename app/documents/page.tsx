import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EnvRequired } from "@/components/env-required";
import { DocumentsTable } from "./documents-table";
import type { Document } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function DocumentsPage() {
  const supabase = createClient();
  if (!supabase) return <EnvRequired />;
  const { data } = await supabase
    .from("documents")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <PageHeader title="Документы" />
      <DocumentsTable documents={(data ?? []) as Document[]} />
    </div>
  );
}
