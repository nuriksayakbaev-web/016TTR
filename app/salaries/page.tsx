import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { SalariesTable } from "./salaries-table";
import type { Salary } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SalariesPage() {
  const supabase = createClient();
  const { data } = await supabase
    .from("salaries")
    .select("*")
    .order("month", { ascending: false });

  return (
    <div className="space-y-4">
      <PageHeader title="Зарплаты" />
      <SalariesTable salaries={(data ?? []) as Salary[]} />
    </div>
  );
}
