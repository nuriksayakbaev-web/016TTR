"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Transaction } from "@/lib/types";
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
import { formatMoney } from "@/lib/currency";
import { downloadExcel, type ExcelColumn } from "@/lib/excel";
import { Pencil, Trash2, Plus, FileDown, Wallet } from "lucide-react";

const COLS: ExcelColumn[] = [
  { key: "type", label: "Тип" },
  { key: "amount", label: "Сумма" },
  { key: "category", label: "Категория" },
  { key: "date", label: "Дата" },
  { key: "comment", label: "Комментарий" },
];

export function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [list, setList] = useState<Transaction[]>(transactions);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [form, setForm] = useState({
    type: "expense" as Transaction["type"],
    amount: 0,
    category: "",
    date: new Date().toISOString().slice(0, 10),
    comment: "",
  });
  const supabase = createClient();

  useEffect(() => setList(transactions), [transactions]);

  function refresh() {
    router.refresh();
    router.replace(pathname);
  }

  function openCreate() {
    setEditing(null);
    setForm({
      type: "expense",
      amount: 0,
      category: "",
      date: new Date().toISOString().slice(0, 10),
      comment: "",
    });
    setOpen(true);
  }

  function openEdit(t: Transaction) {
    setEditing(t);
    setForm({
      type: t.type,
      amount: t.amount,
      category: t.category,
      date: t.date,
      comment: t.comment ?? "",
    });
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) {
      toast.error("Не заданы переменные Supabase. Vercel → Environment Variables → Redeploy.");
      return;
    }
    const payload = {
      type: form.type,
      amount: Number(form.amount),
      category: form.category || "—",
      date: form.date,
      comment: form.comment || null,
    };
    if (editing) {
      const { error } = await updateRow(supabase, "transactions", editing.id, payload);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Транзакция обновлена");
      setOpen(false);
      refresh();
    } else {
      const { data: inserted, error } = await insertRow(supabase, "transactions", payload);
      if (error) {
        toast.error(error.message);
        return;
      }
      setOpen(false);
      const row = (inserted ?? null) as Transaction | null;
      if (row) setList((prev) => [row, ...prev]);
      toast.success("Транзакция добавлена");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить транзакцию?")) return;
    if (!supabase) return;
    const { error } = await deleteRow(supabase, "transactions", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Транзакция удалена");
    setList((prev) => prev.filter((t) => t.id !== id));
  }

  function handleExport() {
    const rows = list.map((t) => ({
      ...t,
      type: t.type === "income" ? "Доход" : "Расход",
    }));
    downloadExcel("Транзакции", COLS, rows, "transactions");
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
        <Button onClick={openCreate} disabled={!supabase}>
          <Plus className="mr-2 h-4 w-4" />
          Добавить
        </Button>
        <Button variant="outline" size="sm" onClick={handleExport} disabled={list.length === 0}>
          <FileDown className="mr-2 h-4 w-4" />
          Excel
        </Button>
      </div>
      <div className="rounded-card border border-border/80 bg-card shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Тип</TableHead>
              <TableHead>Сумма</TableHead>
              <TableHead>Категория</TableHead>
              <TableHead>Дата</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  <EmptyState icon={Wallet} title="Нет транзакций" action={<Button onClick={openCreate}>Добавить</Button>} />
                </TableCell>
              </TableRow>
            ) : (
              list.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <span className={t.type === "income" ? "text-emerald-600" : "text-rose-600"}>
                      {t.type === "income" ? "Доход" : "Расход"}
                    </span>
                  </TableCell>
                  <TableCell className="font-medium">{formatMoney(Number(t.amount))}</TableCell>
                  <TableCell>{t.category}</TableCell>
                  <TableCell>{new Date(t.date).toLocaleDateString("ru-RU")}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(t)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(t.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
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
            <DialogTitle>{editing ? "Редактировать" : "Новая транзакция"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Тип</Label>
                <Select
                  value={form.type}
                  onValueChange={(v) => setForm((f) => ({ ...f, type: v as Transaction["type"] }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="income">Доход</SelectItem>
                    <SelectItem value="expense">Расход</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Сумма</Label>
                <Input
                  type="number"
                  step="0.01"
                  required
                  value={form.amount || ""}
                  onChange={(e) => setForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Категория</Label>
              <Input
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Дата</Label>
              <Input
                type="date"
                required
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Комментарий</Label>
              <Input
                value={form.comment}
                onChange={(e) => setForm((f) => ({ ...f, comment: e.target.value }))}
              />
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
