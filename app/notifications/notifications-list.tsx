"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Notification } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Receipt, ListTodo } from "lucide-react";
import { useToast } from "@/lib/toast";

export function NotificationsList({
  notifications,
}: {
  notifications: Notification[];
}) {
  const router = useRouter();
  const toast = useToast();
  const [list, setList] = useState<Notification[]>(notifications);

  useEffect(() => {
    setList(notifications);
  }, [notifications]);

  async function fetchList() {
    const supabase = createClient();
    if (!supabase) return;
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .order("date", { ascending: false })
      .limit(100);
    if (data) {
      setList(data as Notification[]);
    }
  }

  async function markRead(id: string) {
    const supabase = createClient();
    if (!supabase) {
      toast.error("Не заданы переменные Supabase.");
      return;
    }
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", id);
      if (error) {
        toast.error(error.message);
        return;
      }
      // Оптимистичное обновление
      setList((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      // Перезагружаем свежие данные из БД
      await fetchList();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка при обновлении уведомления");
      // В случае ошибки перезагружаем данные для восстановления состояния
      await fetchList();
    }
  }

  async function markAllRead() {
    const supabase = createClient();
    if (!supabase) {
      toast.error("Не заданы переменные Supabase.");
      return;
    }
    const unread = list.filter((n) => !n.read);
    if (unread.length === 0) return;
    const unreadIds = unread.map((n) => n.id);
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .in("id", unreadIds);
      if (error) {
        toast.error(error.message);
        return;
      }
      // Оптимистичное обновление
      setList((prev) => prev.map((n) => ({ ...n, read: true })));
      // Перезагружаем свежие данные из БД
      await fetchList();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка при обновлении уведомлений");
      // В случае ошибки перезагружаем данные для восстановления состояния
      await fetchList();
    }
  }

  const unreadCount = list.filter((n) => !n.read).length;

  return (
    <div className="space-y-2">
      {unreadCount > 0 && (
        <Button variant="outline" size="sm" onClick={markAllRead}>
          Отметить все прочитанными
        </Button>
      )}
      <div className="rounded-card border border-border/80 bg-card shadow-card overflow-hidden">
        <ul className="divide-y divide-border/60">
          {list.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-muted-foreground">
              Нет уведомлений
            </li>
          ) : (
            list.map((n) => (
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
