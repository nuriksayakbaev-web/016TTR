import { createClient } from "@/lib/supabase/server";
import { TemplatesTable } from "./templates-table";
import { PageHeader } from "@/components/page-header";
import type { InvoiceTemplate } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function InvoiceTemplatesPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("invoice_templates")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-4">
      <PageHeader title="Шаблоны счетов" />
      <p className="text-sm text-muted-foreground -mt-4">
        Счета создаются автоматически при заходе в систему по расписанию.
      </p>
      <TemplatesTable templates={(data ?? []) as InvoiceTemplate[]} />
    </div>
  );
}
