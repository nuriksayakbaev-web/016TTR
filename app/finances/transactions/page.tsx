import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EnvRequired } from "@/components/env-required";
import { TransactionsTable } from "./transactions-table";
import type { Transaction } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TransactionsPage() {
  const supabase = createClient();
  if (!supabase) return <EnvRequired />;
  const { data } = await supabase
    .from("transactions")
    .select("*")
    .order("date", { ascending: false });

  return (
    <div className="space-y-4">
      <PageHeader title="Транзакции" />
      <TransactionsTable transactions={(data ?? []) as Transaction[]} />
    </div>
  );
}
