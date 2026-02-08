"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Task } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { downloadExcel, type ExcelColumn } from "@/lib/excel";
import { Pencil, Trash2, Plus, FileDown, ListTodo, Star } from "lucide-react";

const statusLabel: Record<string, string> = { todo: "К выполнению", in_progress: "В работе", done: "Готово" };
const priorityLabel: Record<string, string> = { low: "Низкий", medium: "Средний", high: "Высокий" };

const COLS: ExcelColumn[] = [
  { key: "title", label: "Название" },
  { key: "status", label: "Статус" },
  { key: "priority", label: "Приоритет" },
  { key: "deadline", label: "Дедлайн" },
  { key: "is_urgent", label: "Срочная" },
];

export function TasksTable({ tasks }: { tasks: Task[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [list, setList] = useState<Task[]>(tasks);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    status: "todo" as Task["status"],
    priority: "medium" as Task["priority"],
    deadline: "",
    is_urgent: false,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => setList(tasks), [tasks]);

  function refresh() {
    router.refresh();
    router.replace(pathname);
  }

  function openCreate() {
    setFormError(null);
    setEditing(null);
    setForm({
      title: "",
      description: "",
      status: "todo",
      priority: "medium",
      deadline: "",
      is_urgent: false,
    });
    setOpen(true);
  }

  function openEdit(t: Task) {
    setFormError(null);
    setEditing(t);
    setForm({
      title: t.title,
      description: t.description ?? "",
      status: t.status,
      priority: t.priority,
      deadline: t.deadline ?? "",
      is_urgent: t.is_urgent ?? false,
    });
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!supabase) {
      setFormError("Не заданы переменные Supabase. Проверьте Vercel → Environment Variables и Redeploy.");
      return;
    }
    const payload = {
      title: form.title,
      description: form.description || null,
      status: form.status,
      priority: form.priority,
      deadline: form.deadline || null,
      is_urgent: form.is_urgent,
    };
    if (editing) {
      const { error } = await updateRow(supabase, "tasks", editing.id, payload);
      if (error) {
        setFormError(error.message);
        toast.error(error.message);
        return;
      }
      toast.success("Задача обновлена");
      setOpen(false);
      refresh();
    } else {
      const { data: inserted, error } = await insertRow(supabase, "tasks", payload);
      if (error) {
        setFormError(error.message);
        toast.error(error.message);
        return;
      }
      setOpen(false);
      const row = (inserted ?? null) as Task | null;
      if (row) setList((prev) => [row, ...prev]);
      toast.success("Задача добавлена");
    }
  }

  async function toggleUrgent(t: Task) {
    if (!supabase) return;
    const { error } = await updateRow(supabase, "tasks", t.id, { is_urgent: !t.is_urgent });
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success(t.is_urgent ? "Снято со срочных" : "Отмечено как срочная");
    setList((prev) => prev.map((x) => (x.id === t.id ? { ...x, is_urgent: !x.is_urgent } : x)));
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить задачу?")) return;
    if (!supabase) return;
    const { error } = await deleteRow(supabase, "tasks", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Задача удалена");
    setList((prev) => prev.filter((t) => t.id !== id));
  }

  function handleExport() {
    const rows = list.map((t) => ({
      ...t,
      status: statusLabel[t.status] ?? t.status,
      priority: priorityLabel[t.priority] ?? t.priority,
      is_urgent: t.is_urgent ? "Да" : "Нет",
    }));
    downloadExcel("Задачи", COLS, rows, "tasks");
    toast.success("Экспорт завершён");
  }

  return (
    <div className="space-y-2">
      {!supabase && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
          Не заданы переменные Supabase. Добавьте в Vercel → Environment Variables и Redeploy.
        </div>
      )}
      <div className="flex gap-2">
        <Button onClick={openCreate} disabled={!supabase}><Plus className="mr-2 h-4 w-4" /> Добавить</Button>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={list.length === 0}>
          <FileDown className="mr-2 h-4 w-4" /> Excel
        </Button>
      </div>
      <div className="rounded-card border border-border/80 bg-card shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-8" />
              <TableHead>Название</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead>Приоритет</TableHead>
              <TableHead>Дедлайн</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  <EmptyState icon={ListTodo} title="Нет задач" action={<Button onClick={openCreate}>Добавить</Button>} />
                </TableCell>
              </TableRow>
            ) : (
              list.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleUrgent(t)} title={t.is_urgent ? "Убрать из срочных" : "Срочная"}>
                      <Star className={`h-4 w-4 ${t.is_urgent ? "fill-amber-500 text-amber-500" : "text-muted-foreground"}`} />
                    </Button>
                  </TableCell>
                  <TableCell className="font-medium">{t.title}</TableCell>
                  <TableCell><Badge variant="secondary">{statusLabel[t.status] ?? t.status}</Badge></TableCell>
                  <TableCell className="text-muted-foreground">{priorityLabel[t.priority] ?? t.priority}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {t.deadline ? new Date(t.deadline).toLocaleDateString("ru-RU") : "—"}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(t)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
            <DialogTitle>{editing ? "Редактировать задачу" : "Новая задача"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            {formError && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </div>
            )}
            <div className="space-y-2">
              <Label>Название</Label>
              <Input required value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Описание</Label>
              <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Статус</Label>
                <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as Task["status"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">К выполнению</SelectItem>
                    <SelectItem value="in_progress">В работе</SelectItem>
                    <SelectItem value="done">Готово</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Приоритет</Label>
                <Select value={form.priority} onValueChange={(v) => setForm((f) => ({ ...f, priority: v as Task["priority"] }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Низкий</SelectItem>
                    <SelectItem value="medium">Средний</SelectItem>
                    <SelectItem value="high">Высокий</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Дедлайн</Label>
              <Input type="date" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="urgent" checked={form.is_urgent} onChange={(e) => setForm((f) => ({ ...f, is_urgent: e.target.checked }))} className="h-4 w-4 rounded border-input" />
              <Label htmlFor="urgent">Срочная</Label>
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
