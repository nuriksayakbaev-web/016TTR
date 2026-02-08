import { createClient } from "@/lib/supabase/server";
import { runOverdueUpdate } from "@/lib/automations";
import { InvoicesTable } from "./invoices-table";
import { InvoiceFilters } from "./invoice-filters";
import { PageHeader } from "@/components/page-header";
import type { Invoice } from "@/lib/types";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{
    status?: string;
    from?: string;
    to?: string;
    filter?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page ?? "1", 10));
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = createClient();
  await runOverdueUpdate(supabase);
  let q = supabase
    .from("invoices")
    .select("*", { count: "exact" })
    .order("due_date", { ascending: false })
    .range(from, to);

  if (params.status && params.status !== "all") {
    q = q.eq("status", params.status);
  }
  if (params.filter === "unpaid") {
    q = q.in("status", ["draft", "sent", "overdue"]);
  }
  if (params.from) q = q.gte("due_date", params.from);
  if (params.to) q = q.lte("due_date", params.to);

  const { data: invoices, error, count } = await q;
  if (error) throw new Error(error.message);

  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);

  return (
    <div className="space-y-4">
      <PageHeader title="Счета на оплату" />
      <InvoiceFilters />
      <InvoicesTable
        invoices={(invoices ?? []) as Invoice[]}
        totalCount={totalCount}
        page={page}
        pageSize={PAGE_SIZE}
        totalPages={totalPages}
      />
    </div>
  );
}
