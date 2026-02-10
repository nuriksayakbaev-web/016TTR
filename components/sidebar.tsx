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
  Menu,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Notification } from "@/lib/types";
import { createClient } from "@/lib/supabase/client";
import { updateRow } from "@/lib/supabaseService";
import { useToast } from "@/lib/toast";

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
  const toast = useToast();
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [open, setOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
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

  useEffect(() => {
    setMobileOpen(false);
    setOpen(false);
  }, [pathname]);

  async function markRead(id: string) {
    const supabase = createClient();
    if (!supabase) return;
    const { error } = await updateRow(supabase, "notifications", id, { read: true });
    if (error) {
      toast.error(error.message);
      return;
    }
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
    <>
      <div className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border/60 bg-card px-3 md:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Открыть меню"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <span className="font-semibold text-foreground">016TTR</span>
        <Link
          href="/notifications"
          className="relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Уведомления"
        >
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
              {count > 9 ? "9+" : count}
            </span>
          )}
        </Link>
      </div>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          aria-label="Закрыть меню"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-40 flex w-72 flex-col border-l border-border/80 bg-card shadow-xl transition-transform md:static md:z-0 md:flex md:w-56 md:translate-x-0 md:shadow-sm",
          mobileOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex h-14 items-center justify-between border-b border-border/60 px-4 font-semibold text-foreground md:px-5">
          016TTR
          <div className="relative hidden md:block" ref={ref}>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Уведомления"
            >
              <Bell className="h-5 w-5" />
              {count > 0 && (
                <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-medium text-destructive-foreground">
                  {count > 9 ? "9+" : count}
                </span>
              )}
            </button>
            {open && (
              <div className="fixed left-2 right-2 top-16 z-50 rounded-card border border-border/80 bg-card py-1 shadow-card-hover md:left-auto md:right-3 md:w-[22rem]">
                <div className="border-b px-3 py-2 text-sm font-medium">
                  Уведомления
                </div>
                <div className="max-h-[70vh] overflow-auto">
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
                        <span className="min-w-0 flex-1 text-sm break-words">{n.message}</span>
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
                  "flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                onClick={() => setMobileOpen(false)}
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
    </>
  );
}
