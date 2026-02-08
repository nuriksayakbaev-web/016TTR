import { createClient } from "@/lib/supabase/server";
import { runInvoiceTemplates, syncNotifications } from "@/lib/automations";
import { Sidebar } from "./sidebar";
import type { Notification } from "@/lib/types";

export async function SidebarWrapper() {
  const supabase = createClient();
  if (!supabase) return <Sidebar initialNotifications={[]} />;

  await runInvoiceTemplates(supabase);
  await syncNotifications(supabase);

  const { data: notifications } = await supabase
    .from("notifications")
    .select("*")
    .eq("read", false)
    .order("date", { ascending: true })
    .limit(50);

  return (
    <Sidebar
      initialNotifications={(notifications ?? []) as Notification[]}
    />
  );
}
