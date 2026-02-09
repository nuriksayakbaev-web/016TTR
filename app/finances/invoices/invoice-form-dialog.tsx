"use client";

import { useEffect, useState } from "react";
import { Invoice } from "@/lib/types";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { insertRow, updateRow } from "@/lib/supabaseService";
import { useToast } from "@/lib/toast";

const statusOptions = [
  { value: "draft", label: "Черновик" },
  { value: "sent", label: "Отправлен" },
  { value: "paid", label: "Оплачен" },
  { value: "overdue", label: "Просрочен" },
  { value: "canceled", label: "Отменён" },
];

const empty: Omit<Invoice, "id" | "created_at"> = {
  invoice_number: "",
  client_name: "",
  issue_date: new Date().toISOString().slice(0, 10),
  due_date: new Date().toISOString().slice(0, 10),
  amount: 0,
  status: "draft",
  comment: null,
};

export function InvoiceFormDialog({
  open,
  onOpenChange,
  invoice,
  onSuccess,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Invoice | null;
  onSuccess: (newInvoice?: Invoice | null) => void;
}) {
  const [form, setForm] = useState(empty);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const supabase = createClient();
  const toast = useToast();

  useEffect(() => {
    setFormError(null);
    if (invoice) {
      setForm({
        invoice_number: invoice.invoice_number,
        client_name: invoice.client_name,
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        amount: invoice.amount,
        status: invoice.status,
        comment: invoice.comment,
      });
    } else {
      setForm({
        ...empty,
        issue_date: new Date().toISOString().slice(0, 10),
        due_date: new Date().toISOString().slice(0, 10),
      });
    }
  }, [invoice, open]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!supabase) {
      const msg = "Не заданы переменные Supabase. Vercel → Environment Variables → Redeploy.";
      setFormError(msg);
      toast.error(msg);
      return;
    }
    setSaving(true);
    const payload = {
      invoice_number: form.invoice_number,
      client_name: form.client_name,
      issue_date: form.issue_date,
      due_date: form.due_date,
      amount: Number(form.amount),
      status: form.status,
      comment: form.comment || null,
    };
    try {
      if (invoice?.id) {
        const { error } = await updateRow(supabase, "invoices", invoice.id, payload);
        if (error) {
          const msg = error.message;
          setFormError(msg);
          toast.error(msg);
          setSaving(false);
          console.error("[016TTR] Invoice save error:", msg);
          return;
        }
        setSaving(false);
        onOpenChange(false);
        onSuccess();
      } else {
        const { data: inserted, error } = await insertRow(supabase, "invoices", payload);
        if (error) {
          const msg = error.message;
          setFormError(msg);
          toast.error(msg);
          setSaving(false);
          console.error("[016TTR] Invoice save error:", msg);
          return;
        }
        setSaving(false);
        onOpenChange(false);
        onSuccess((inserted ?? null) as Invoice | null);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setFormError(msg);
      toast.error(msg);
      setSaving(false);
      console.error("[016TTR] Invoice save exception:", err);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{invoice ? "Редактировать счёт" : "Новый счёт"}</DialogTitle>
        </DialogHeader>
        {formError && (
          <div
            role="alert"
            className="rounded-lg border-2 border-red-500 bg-red-600 px-4 py-3 text-sm font-medium text-white"
          >
            Ошибка сохранения: {formError}
          </div>
        )}
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Номер счёта</Label>
              <Input
                required
                value={form.invoice_number}
                onChange={(e) =>
                  setForm((f) => ({ ...f, invoice_number: e.target.value }))
                }
              />
            </div>
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
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Дата выдачи</Label>
              <Input
                type="date"
                required
                value={form.issue_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, issue_date: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Срок оплаты</Label>
              <Input
                type="date"
                required
                value={form.due_date}
                onChange={(e) =>
                  setForm((f) => ({ ...f, due_date: e.target.value }))
                }
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Сумма</Label>
              <Input
                type="number"
                step="0.01"
                required
                value={form.amount || ""}
                onChange={(e) =>
                  setForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Статус</Label>
              <Select
                value={form.status}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, status: v as Invoice["status"] }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Комментарий</Label>
            <Input
              value={form.comment ?? ""}
              onChange={(e) =>
                setForm((f) => ({ ...f, comment: e.target.value || null }))
              }
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Отмена
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Сохранение…" : "Сохранить"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
