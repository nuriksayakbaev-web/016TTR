"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { Notification } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Receipt, ListTodo } from "lucide-react";

export function NotificationsList({
  notifications,
}: {
  notifications: Notification[];
}) {
  const router = useRouter();
  const supabase = createClient();

  async function markRead(id: string) {
    if (!supabase) return;
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    router.refresh();
  }

  async function markAllRead() {
    if (!supabase) return;
    const unread = notifications.filter((n) => !n.read).map((n) => n.id);
    if (unread.length) {
      await supabase.from("notifications").update({ read: true }).in("id", unread);
      router.refresh();
    }
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="space-y-2">
      {unreadCount > 0 && (
        <Button variant="outline" size="sm" onClick={markAllRead}>
          Отметить все прочитанными
        </Button>
      )}
      <div className="rounded-card border border-border/80 bg-card shadow-card overflow-hidden">
        <ul className="divide-y divide-border/60">
          {notifications.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">
              Нет уведомлений
            </li>
          ) : (
            notifications.map((n) => (
              <li
                key={n.id}
                className={`flex items-center justify-between gap-4 px-4 py-3 ${
                  n.read ? "bg-muted/30" : ""
                }`}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  {n.type === "invoice" ? (
                    <Receipt className="h-4 w-4 shrink-0 text-muted-foreground" />
                  ) : (
                    <ListTodo className="h-4 w-4 shrink-0 text-muted-foreground" />
                  )}
                  <span className="text-sm">{n.message}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {new Date(n.date).toLocaleDateString("ru-RU")}
                  </span>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {!n.read && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => markRead(n.id)}
                    >
                      Прочитано
                    </Button>
                  )}
                  <Link
                    href={
                      n.type === "invoice"
                        ? "/finances/invoices"
                        : "/tasks"
                    }
                    className="text-sm text-primary hover:underline"
                  >
                    Открыть
                  </Link>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
