"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  FileText,
  Wallet,
  Receipt,
  Banknote,
  ListTodo,
  StickyNote,
  Calendar,
  LayoutDashboard,
  Bell,
  FileStack,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";

const nav = [
  { href: "/", label: "Дашборд", icon: LayoutDashboard, iconColor: "text-blue-600" },
  { href: "/documents", label: "Документы", icon: FileText, iconColor: "text-sky-600" },
  { href: "/finances/transactions", label: "Транзакции", icon: Wallet, iconColor: "text-emerald-600" },
  { href: "/finances/invoices", label: "Счета", icon: Receipt, iconColor: "text-violet-600" },
  { href: "/finances/invoices/templates", label: "Шаблоны счетов", icon: FileStack, iconColor: "text-purple-600" },
  { href: "/salaries", label: "Зарплаты", icon: Banknote, iconColor: "text-amber-600" },
  { href: "/tasks", label: "Задачи", icon: ListTodo, iconColor: "text-orange-600" },
  { href: "/notes", label: "Заметки", icon: StickyNote, iconColor: "text-yellow-600" },
  { href: "/calendar", label: "Календарь", icon: Calendar, iconColor: "text-cyan-600" },
];

export function Sidebar({
  initialNotifications = [],
}: {
  initialNotifications?: Notification[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setNotifications(initialNotifications);
  }, [initialNotifications]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  async function markRead(id: string) {
    const supabase = createClient();
    await supabase.from("notifications").update({ read: true }).eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    setOpen(false);
    router.refresh();
  }

  const unread = notifications.filter((n) => !n.read);
  const count = unread.length;

  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const dateStr =
    now?.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }) ?? "—";
  const timeStr =
    now?.toLocaleTimeString("ru-RU", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    }) ?? "—";

  return (
    <aside className="flex w-56 flex-col border-r border-border/80 bg-card shadow-sm">
      <div className="flex h-14 items-center justify-between border-b border-border/60 px-5 font-semibold text-foreground">
        016TTR
        <div className="relative" ref={ref}>
          <button
            type="button"
            onClick={() => setOpen((o) => !o)}
            className="relative rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Уведомления"
          >
            <Bell className="h-5 w-5" />
            {count > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                {count > 9 ? "9+" : count}
              </span>
            )}
          </button>
          {open && (
            <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-card border border-border/80 bg-card py-1 shadow-card-hover">
              <div className="border-b px-3 py-2 text-sm font-medium">
                Уведомления
              </div>
              <div className="max-h-64 overflow-auto">
                {unread.length === 0 ? (
                  <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                    Нет новых
                  </div>
                ) : (
                  unread.slice(0, 10).map((n) => (
                    <div
                      key={n.id}
                      className="flex items-start justify-between gap-2 border-b border-transparent px-3 py-2 last:border-0 hover:bg-muted/50"
                    >
                      <span className="text-sm">{n.message}</span>
                      <button
                        type="button"
                        onClick={() => markRead(n.id)}
                        className="shrink-0 text-xs text-primary hover:underline"
                      >
                        Прочитано
                      </button>
                    </div>
                  ))
                )}
              </div>
              {count > 0 && (
                <Link
                  href="/notifications"
                  onClick={() => setOpen(false)}
                  className="block border-t px-3 py-2 text-center text-sm text-primary hover:bg-muted/50"
                >
                  Все уведомления
                </Link>
              )}
            </div>
          )}
        </div>
      </div>
      <nav className="flex flex-col gap-0.5 p-3">
        {nav.map(({ href, label, icon: Icon, iconColor }) => {
          const active =
            pathname === href ||
            (href !== "/" &&
              pathname.startsWith(href) &&
              (pathname.length === href.length || pathname[href.length] === "?"));
          return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Icon className={cn("h-4 w-4 shrink-0", !active && iconColor)} />
            {label}
          </Link>
          );
        })}
      </nav>
      <div className="mt-auto border-t border-border/60 px-4 py-3 text-left">
        <p className="text-xs font-medium text-muted-foreground">{dateStr}</p>
        <p className="mt-0.5 font-mono text-sm font-medium text-foreground tabular-nums">
          {timeStr}
        </p>
      </div>
    </aside>
  );
}
