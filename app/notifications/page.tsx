import { createClient } from "@/lib/supabase/server";
import { syncNotifications } from "@/lib/automations";
import { NotificationsList } from "./notifications-list";
import { PageHeader } from "@/components/page-header";
import type { Notification } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const supabase = createClient();
  await syncNotifications(supabase);

  const { data } = await supabase
    .from("notifications")
    .select("*")
    .order("date", { ascending: false })
    .limit(100);

  return (
    <div className="space-y-4">
      <PageHeader title="Уведомления" />
      <NotificationsList notifications={(data ?? []) as Notification[]} />
    </div>
  );
}
