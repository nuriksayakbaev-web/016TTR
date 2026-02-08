"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Salary } from "@/lib/types";
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
import { EmptyState } from "@/components/empty-state";
import { createClient } from "@/lib/supabase/client";
import { deleteRow, insertRow, updateRow } from "@/lib/supabaseService";
import { useToast } from "@/lib/toast";
import { formatMoney } from "@/lib/currency";
import { downloadExcel, type ExcelColumn } from "@/lib/excel";
import { Pencil, Trash2, Plus, FileDown, Banknote } from "lucide-react";

const COLS: ExcelColumn[] = [
  { key: "fio", label: "ФИО" },
  { key: "month", label: "Месяц" },
  { key: "total", label: "Сумма" },
  { key: "paid", label: "Статус" },
];

const MONTHS = [
  "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12",
];

export function SalariesTable({ salaries }: { salaries: Salary[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [list, setList] = useState<Salary[]>(salaries);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Salary | null>(null);
  const [form, setForm] = useState({
    fio: "",
    month: "",
    year: new Date().getFullYear().toString(),
    total: 0,
    paid: false,
  });
  const supabase = createClient();

  useEffect(() => {
    setList(salaries);
  }, [salaries]);

  async function fetchList() {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("salaries")
      .select("*")
      .order("month", { ascending: false });
    if (error) {
      toast.error(error.message);
      return;
    }
    setList((data ?? []) as Salary[]);
  }

  useEffect(() => {
    if (pathname !== "/salaries") return;
    void fetchList();
  }, [pathname, supabase]);

  function openCreate() {
    setEditing(null);
    setForm({
      fio: "",
      month: String(new Date().getMonth() + 1).padStart(2, "0"),
      year: new Date().getFullYear().toString(),
      total: 0,
      paid: false,
    });
    setOpen(true);
  }

  function openEdit(s: Salary) {
    setEditing(s);
    const [y, m] = (s.month || "").split("-");
    setForm({
      fio: s.fio ?? "",
      month: m || String(new Date().getMonth() + 1).padStart(2, "0"),
      year: y || new Date().getFullYear().toString(),
      total: Number(s.total),
      paid: s.paid,
    });
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      toast.error("Не заданы переменные Supabase. Vercel → Environment Variables → Redeploy.");
      return;
    }
    const monthStr = `${form.year}-${form.month}`;
    const amount = Number(form.total);
    const payload = {
      fio: form.fio || null,
      month: monthStr,
      base: amount,
      bonus: 0,
      penalty: 0,
      total: amount,
      paid: form.paid,
    };
    if (editing) {
      const { error } = await updateRow(supabase, "salaries", editing.id, payload);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Запись обновлена");
      setOpen(false);
      await fetchList();
    } else {
      const { data: inserted, error } = await insertRow(supabase, "salaries", payload);
      if (error) {
        toast.error(error.message);
        return;
      }
      setOpen(false);
      const row = (inserted ?? null) as Salary | null;
      if (row) setList((prev) => [row, ...prev]);
      toast.success("Запись добавлена");
      await fetchList();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить запись?")) return;
    if (!supabase) return;
    const { error } = await deleteRow(supabase, "salaries", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Запись удалена");
    await fetchList();
  }

  function handleExport() {
    const rows = list.map((s) => ({
      ...s,
      fio: s.fio ?? "—",
      paid: s.paid ? "Оплачено" : "Не оплачено",
    }));
    downloadExcel("Зарплаты", COLS, rows, "salaries");
    toast.success("Экспорт завершён");
  }

  return (
    <div className="space-y-2">
      {!supabase && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
          Не заданы переменные Supabase. Vercel → Environment Variables → Redeploy.
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
              <TableHead>ФИО</TableHead>
              <TableHead>Месяц</TableHead>
              <TableHead className="text-right">Сумма</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  <EmptyState icon={Banknote} title="Нет записей" action={<Button onClick={openCreate}>Добавить</Button>} />
                </TableCell>
              </TableRow>
            ) : (
              list.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.fio ?? "—"}</TableCell>
                  <TableCell>{s.month}</TableCell>
                  <TableCell className="text-right font-medium">{formatMoney(Number(s.total))}</TableCell>
                  <TableCell>{s.paid ? "Оплачено" : "Не оплачено"}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(s.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
            <DialogTitle>{editing ? "Редактировать" : "Новая запись"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>ФИО</Label>
              <Input
                value={form.fio}
                onChange={(e) => setForm((f) => ({ ...f, fio: e.target.value }))}
                placeholder="Иванов Иван Иванович"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Месяц</Label>
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={form.month}
                  onChange={(e) => setForm((f) => ({ ...f, month: e.target.value }))}
                >
                  {MONTHS.map((m) => (
                    <option key={m} value={m}>
                      {new Date(2000, parseInt(m, 10) - 1).toLocaleString("ru-RU", { month: "long" })}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Год</Label>
                <Input
                  type="number"
                  min={2000}
                  max={2100}
                  value={form.year}
                  onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Сумма</Label>
              <Input
                type="number"
                step="0.01"
                required
                value={form.total || ""}
                onChange={(e) => setForm((f) => ({ ...f, total: parseFloat(e.target.value) || 0 }))}
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="paid"
                checked={form.paid}
                onChange={(e) => setForm((f) => ({ ...f, paid: e.target.checked }))}
                className="h-4 w-4 rounded border-input"
              />
              <Label htmlFor="paid">Оплачено</Label>
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
