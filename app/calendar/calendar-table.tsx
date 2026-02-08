"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { CalendarEvent } from "@/lib/types";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { EmptyState } from "@/components/empty-state";
import { createClient } from "@/lib/supabase/client";
import { deleteRow, insertRow, updateRow } from "@/lib/supabaseService";
import { useToast } from "@/lib/toast";
import { Pencil, Trash2, Plus, Calendar } from "lucide-react";

const relatedLabel: Record<string, string> = {
  task: "Задача",
  invoice: "Счёт",
  salary: "Зарплата",
  custom: "Своё",
};

export function CalendarTable({ events }: { events: CalendarEvent[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [list, setList] = useState<CalendarEvent[]>(events);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CalendarEvent | null>(null);
  const [form, setForm] = useState({
    title: "",
    date: new Date().toISOString().slice(0, 10),
    related_type: "custom" as CalendarEvent["related_type"],
    related_id: "",
  });
  const supabase = createClient();

  useEffect(() => setList(events), [events]);

  async function fetchList() {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("calendar_events")
      .select("*")
      .order("date", { ascending: true });
    if (error) {
      toast.error(error.message);
      return;
    }
    setList((data ?? []) as CalendarEvent[]);
  }

  useEffect(() => {
    if (pathname !== "/calendar") return;
    void fetchList();
  }, [pathname, supabase]);

  function openCreate() {
    setEditing(null);
    setForm({
      title: "",
      date: new Date().toISOString().slice(0, 10),
      related_type: "custom",
      related_id: "",
    });
    setOpen(true);
  }

  function openEdit(e: CalendarEvent) {
    setEditing(e);
    setForm({
      title: e.title,
      date: e.date,
      related_type: e.related_type,
      related_id: e.related_id ?? "",
    });
    setOpen(true);
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault();
    if (!supabase) {
      toast.error("Не заданы переменные Supabase. Vercel → Environment Variables → Redeploy.");
      return;
    }
    const payload = {
      title: form.title,
      date: form.date,
      related_type: form.related_type,
      related_id: form.related_id || null,
    };
    if (editing) {
      const { error } = await updateRow(supabase, "calendar_events", editing.id, payload);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Событие обновлено");
      setOpen(false);
      await fetchList();
    } else {
      const { data: inserted, error } = await insertRow(supabase, "calendar_events", payload);
      if (error) {
        toast.error(error.message);
        return;
      }
      setOpen(false);
      const row = (inserted ?? null) as CalendarEvent | null;
      if (row) setList((prev) => [row, ...prev]);
      toast.success("Событие добавлено");
      await fetchList();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить событие?")) return;
    if (!supabase) return;
    const { error } = await deleteRow(supabase, "calendar_events", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Событие удалено");
    await fetchList();
  }

  return (
    <div className="space-y-2">
      {!supabase && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
          Не заданы переменные Supabase. Vercel → Environment Variables → Redeploy.
        </div>
      )}
      <Button onClick={openCreate} disabled={!supabase}><Plus className="mr-2 h-4 w-4" /> Добавить</Button>
      <div className="rounded-card border border-border/80 bg-card shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Дата</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="p-0">
                  <EmptyState icon={Calendar} title="Нет событий" action={<Button onClick={openCreate}>Добавить</Button>} />
                </TableCell>
              </TableRow>
            ) : (
              list.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium">{e.title}</TableCell>
                  <TableCell>{new Date(e.date).toLocaleDateString("ru-RU")}</TableCell>
                  <TableCell className="text-muted-foreground">{relatedLabel[e.related_type] ?? e.related_type}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(e)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Редактировать событие" : "Новое событие"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>Название</Label>
              <Input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Дата</Label>
              <Input type="date" required value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Тип связи</Label>
              <Select value={form.related_type} onValueChange={(v) => setForm((f) => ({ ...f, related_type: v as CalendarEvent["related_type"] }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="task">Задача</SelectItem>
                  <SelectItem value="invoice">Счёт</SelectItem>
                  <SelectItem value="salary">Зарплата</SelectItem>
                  <SelectItem value="custom">Своё</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Отмена</Button>
              <Button type="submit">Сохранить</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
