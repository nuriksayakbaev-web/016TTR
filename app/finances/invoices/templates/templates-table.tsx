"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { InvoiceTemplate } from "@/lib/types";
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
import { Pencil, Trash2, Plus, FileStack } from "lucide-react";
import { formatMoney } from "@/lib/currency";

const periodLabel: Record<string, string> = {
  monthly: "Ежемесячно",
  quarterly: "Ежеквартально",
  yearly: "Ежегодно",
};

export function TemplatesTable({ templates }: { templates: InvoiceTemplate[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [list, setList] = useState<InvoiceTemplate[]>(templates);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<InvoiceTemplate | null>(null);
  const [form, setForm] = useState({
    client_name: "",
    amount: 0,
    period: "monthly" as InvoiceTemplate["period"],
    day_of_month: 1,
  });
  const supabase = createClient();

  useEffect(() => setList(templates), [templates]);

  async function fetchList() {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("invoice_templates")
      .select("*");
    if (error) {
      toast.error(error.message);
      return;
    }
    setList((data ?? []) as InvoiceTemplate[]);
  }

  useEffect(() => {
    if (pathname !== "/finances/invoices/templates") return;
    void fetchList();
  }, [pathname, supabase]);

  function openCreate() {
    setEditing(null);
    setForm({
      client_name: "",
      amount: 0,
      period: "monthly",
      day_of_month: 1,
    });
    setOpen(true);
  }

  function openEdit(t: InvoiceTemplate) {
    setEditing(t);
    setForm({
      client_name: t.client_name,
      amount: t.amount,
      period: t.period,
      day_of_month: t.day_of_month,
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
      client_name: form.client_name,
      amount: Number(form.amount),
      period: form.period,
      day_of_month: Math.min(28, Math.max(1, form.day_of_month)),
    };
    if (editing) {
      const { error } = await updateRow(supabase, "invoice_templates", editing.id, payload);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Шаблон обновлён");
      setOpen(false);
      await fetchList();
      router.refresh();
    } else {
      const { data: inserted, error } = await insertRow(supabase, "invoice_templates", payload);
      if (error) {
        toast.error(error.message);
        return;
      }
      setOpen(false);
      const row = (inserted ?? null) as InvoiceTemplate | null;
      if (row) setList((prev) => [row, ...prev]);
      toast.success("Шаблон создан");
      await fetchList();
      router.refresh();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить шаблон? Автогенерация по нему прекратится.")) return;
    if (!supabase) return;
    const { error } = await deleteRow(supabase, "invoice_templates", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Шаблон удалён");
    await fetchList();
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Button onClick={openCreate}>
        <Plus className="mr-2 h-4 w-4" />
        Новый шаблон
      </Button>
      <div className="rounded-card border border-border/80 bg-card shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Клиент</TableHead>
              <TableHead className="text-right">Сумма</TableHead>
              <TableHead>Период</TableHead>
              <TableHead>День месяца</TableHead>
              <TableHead>Последняя генерация</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="p-0">
                  <EmptyState
                    icon={FileStack}
                    title="Нет шаблонов"
                    description="Добавьте шаблон — счета будут создаваться автоматически при заходе в систему."
                    action={<Button onClick={openCreate}>Новый шаблон</Button>}
                  />
                </TableCell>
              </TableRow>
            ) : (
              list.map((t) => (
                <TableRow key={t.id}>
                  <TableCell className="font-medium">{t.client_name}</TableCell>
                  <TableCell className="text-right">
                    {formatMoney(Number(t.amount))}
                  </TableCell>
                  <TableCell>{periodLabel[t.period] ?? t.period}</TableCell>
                  <TableCell>{t.day_of_month}</TableCell>
                  <TableCell>
                    {t.last_generated_at
                      ? new Date(t.last_generated_at).toLocaleDateString("ru-RU")
                      : "—"}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEdit(t)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(t.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
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
            <DialogTitle>
              {editing ? "Редактировать шаблон" : "Новый шаблон"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label>Клиент</Label>
              <Input
                required
                value={form.client_name}
                onChange={(e) =>
                  setForm((f) => ({ ...f, client_name: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Сумма</Label>
              <Input
                type="number"
                step="0.01"
                required
                value={form.amount || ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    amount: parseFloat(e.target.value) || 0,
                  }))
                }
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Период</Label>
                <Select
                  value={form.period}
                  onValueChange={(v) =>
                    setForm((f) => ({ ...f, period: v as InvoiceTemplate["period"] }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Ежемесячно</SelectItem>
                    <SelectItem value="quarterly">Ежеквартально</SelectItem>
                    <SelectItem value="yearly">Ежегодно</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>День месяца (1–28)</Label>
                <Input
                  type="number"
                  min={1}
                  max={28}
                  required
                  value={form.day_of_month}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      day_of_month: Math.min(28, Math.max(1, parseInt(e.target.value, 10) || 1)),
                    }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Отмена
              </Button>
              <Button type="submit">Сохранить</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
