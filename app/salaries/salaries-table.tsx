"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  { key: "month", label: "Месяц" },
  { key: "base", label: "База" },
  { key: "bonus", label: "Бонус" },
  { key: "penalty", label: "Штраф" },
  { key: "total", label: "Итого" },
  { key: "paid", label: "Оплачено" },
];

export function SalariesTable({ salaries }: { salaries: Salary[] }) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Salary | null>(null);
  const [form, setForm] = useState({
    month: "",
    base: 0,
    bonus: 0,
    penalty: 0,
    total: 0,
    paid: false,
  });
  const supabase = createClient();

  function openCreate() {
    setEditing(null);
    setForm({ month: "", base: 0, bonus: 0, penalty: 0, total: 0, paid: false });
    setOpen(true);
  }

  function openEdit(s: Salary) {
    setEditing(s);
    setForm({
      month: s.month,
      base: s.base,
      bonus: s.bonus,
      penalty: s.penalty,
      total: s.total,
      paid: s.paid,
    });
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const total = Number(form.base) + Number(form.bonus) - Number(form.penalty);
    const payload = {
      month: form.month,
      base: Number(form.base),
      bonus: Number(form.bonus),
      penalty: Number(form.penalty),
      total: form.total || total,
      paid: form.paid,
    };
    if (editing) {
      const { error } = await updateRow(supabase, "salaries", editing.id, payload);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Запись обновлена");
    } else {
      const { error } = await insertRow(supabase, "salaries", payload);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Запись добавлена");
    }
    setOpen(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить запись?")) return;
    const { error } = await deleteRow(supabase, "salaries", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Запись удалена");
    router.refresh();
  }

  function handleExport() {
    const rows = salaries.map((s) => ({ ...s, paid: s.paid ? "Да" : "Нет" }));
    downloadExcel("Зарплаты", COLS, rows, "salaries");
    toast.success("Экспорт завершён");
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Добавить</Button>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={!salaries.length}>
          <FileDown className="mr-2 h-4 w-4" /> Excel
        </Button>
      </div>
      <div className="rounded-card border border-border/80 bg-card shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Месяц</TableHead>
              <TableHead className="text-right">База</TableHead>
              <TableHead className="text-right">Бонус</TableHead>
              <TableHead className="text-right">Штраф</TableHead>
              <TableHead className="text-right">Итого</TableHead>
              <TableHead>Оплачено</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {salaries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                  <EmptyState icon={Banknote} title="Нет записей" action={<Button onClick={openCreate}>Добавить</Button>} />
                </TableCell>
              </TableRow>
            ) : (
              salaries.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.month}</TableCell>
                  <TableCell className="text-right">{formatMoney(Number(s.base))}</TableCell>
                  <TableCell className="text-right">{formatMoney(Number(s.bonus))}</TableCell>
                  <TableCell className="text-right">{formatMoney(Number(s.penalty))}</TableCell>
                  <TableCell className="text-right font-medium">{formatMoney(Number(s.total))}</TableCell>
                  <TableCell>{s.paid ? "Да" : "Нет"}</TableCell>
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
              <Label>Месяц (напр. 2025-01)</Label>
              <Input required value={form.month} onChange={(e) => setForm((f) => ({ ...f, month: e.target.value }))} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>База</Label>
                <Input type="number" step="0.01" value={form.base || ""} onChange={(e) => setForm((f) => ({ ...f, base: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-2">
                <Label>Бонус</Label>
                <Input type="number" step="0.01" value={form.bonus || ""} onChange={(e) => setForm((f) => ({ ...f, bonus: parseFloat(e.target.value) || 0 }))} />
              </div>
              <div className="space-y-2">
                <Label>Штраф</Label>
                <Input type="number" step="0.01" value={form.penalty || ""} onChange={(e) => setForm((f) => ({ ...f, penalty: parseFloat(e.target.value) || 0 }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Итого</Label>
              <Input type="number" step="0.01" value={form.total || ""} onChange={(e) => setForm((f) => ({ ...f, total: parseFloat(e.target.value) || 0 }))} />
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
