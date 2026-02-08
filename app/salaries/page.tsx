import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/page-header";
import { EnvRequired } from "@/components/env-required";
import { SalariesTable } from "./salaries-table";
import type { Salary } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function SalariesPage() {
  const supabase = createClient();
  if (!supabase) return <EnvRequired />;
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
