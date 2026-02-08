"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Invoice } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InvoiceFormDialog } from "./invoice-form-dialog";
import { EmptyState } from "@/components/empty-state";
import { createClient } from "@/lib/supabase/client";
import { updateRow, deleteRow } from "@/lib/supabaseService";
import { downloadExcel, exportTableChunked, type ExcelColumn } from "@/lib/excel";
import { useToast } from "@/lib/toast";
import { Pencil, Trash2, FileDown, Receipt } from "lucide-react";
import { formatMoney } from "@/lib/currency";

const statusVariant: Record<string, "draft" | "sent" | "paid" | "overdue" | "canceled"> = {
  draft: "draft",
  sent: "sent",
  paid: "paid",
  overdue: "overdue",
  canceled: "canceled",
};

const statusLabel: Record<string, string> = {
  draft: "Черновик",
  sent: "Отправлен",
  paid: "Оплачен",
  overdue: "Просрочен",
  canceled: "Отменён",
};

const INVOICE_EXCEL_COLUMNS: ExcelColumn[] = [
  { key: "invoice_number", label: "Номер" },
  { key: "client_name", label: "Клиент" },
  { key: "issue_date", label: "Дата выдачи" },
  { key: "due_date", label: "Срок" },
  { key: "amount", label: "Сумма" },
  { key: "status", label: "Статус" },
  { key: "comment", label: "Комментарий" },
];

interface InvoicesTableProps {
  invoices: Invoice[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export function InvoicesTable({
  invoices,
  totalCount,
  page,
  pageSize,
  totalPages,
}: InvoicesTableProps) {
  const router = useRouter();
  const toast = useToast();
  const [editing, setEditing] = useState<Invoice | null>(null);
  const [open, setOpen] = useState(false);
  const [editingStatusId, setEditingStatusId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const supabase = createClient();

  function refresh() {
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить счёт? Это действие нельзя отменить.")) return;
    if (!supabase) return;
    const { error } = await deleteRow(supabase, "invoices", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Счёт удалён");
    refresh();
  }

  async function handleStatusChange(id: string, status: Invoice["status"]) {
    if (!supabase) return;
    setEditingStatusId(id);
    const { error } = await updateRow(supabase, "invoices", id, { status });
    setEditingStatusId(null);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Статус обновлён");
    refresh();
  }

  function handleExportCurrent() {
    const rows = invoices.map((i) => ({
      ...i,
      status: statusLabel[i.status] ?? i.status,
    }));
    downloadExcel("Счета", INVOICE_EXCEL_COLUMNS, rows, "invoices");
    toast.success("Экспорт завершён");
  }

  async function handleExportAll() {
    if (!supabase) {
      toast.error("Не заданы переменные Supabase.");
      return;
    }
    setExporting(true);
    const search = new URLSearchParams(window.location.search);
    try {
      await exportTableChunked(
        async (offset, limit) => {
          let q = supabase
            .from("invoices")
            .select("*")
            .order("due_date", { ascending: false })
            .range(offset, offset + limit - 1);
          const status = search.get("status");
          if (status && status !== "all") q = q.eq("status", status);
          if (search.get("filter") === "unpaid")
            q = q.in("status", ["draft", "sent", "overdue"]);
          const from = search.get("from");
          const to = search.get("to");
          if (from) q = q.gte("due_date", from);
          if (to) q = q.lte("due_date", to);
          const { data } = await q;
          return (data ?? []).map((r) => ({
            ...r,
            status: statusLabel[(r as Invoice).status] ?? (r as Invoice).status,
          }));
        },
        totalCount,
        "Счета",
        INVOICE_EXCEL_COLUMNS,
        "invoices",
        (loaded, total) => {
          if (loaded === total) toast.success(`Экспорт: ${total} записей`);
        }
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Ошибка экспорта");
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportCurrent}
          disabled={invoices.length === 0}
        >
          <FileDown className="mr-2 h-4 w-4" />
          Экспорт страницы
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleExportAll}
          disabled={totalCount === 0 || exporting}
        >
          {exporting ? "Экспорт…" : "Экспорт всего"}
        </Button>
        <Button
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          Новый счёт
        </Button>
      </div>
      <div className="rounded-card border border-border/80 bg-card shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Номер</TableHead>
              <TableHead>Клиент</TableHead>
              <TableHead>Дата выдачи</TableHead>
              <TableHead>Срок</TableHead>
              <TableHead className="text-right">Сумма</TableHead>
              <TableHead>Статус</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="p-0">
                  <EmptyState
                    icon={Receipt}
                    title="Нет счетов"
                    description={
                      totalCount === 0
                        ? "Добавьте первый счёт кнопкой выше."
                        : "По выбранным фильтрам записей нет."
                    }
                    action={
                      totalCount === 0 && (
                        <Button onClick={() => setOpen(true)}>Новый счёт</Button>
                      )
                    }
                  />
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((inv) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-medium">{inv.invoice_number}</TableCell>
                  <TableCell>{inv.client_name}</TableCell>
                  <TableCell>
                    {new Date(inv.issue_date).toLocaleDateString("ru-RU")}
                  </TableCell>
                  <TableCell>
                    {new Date(inv.due_date).toLocaleDateString("ru-RU")}
                  </TableCell>
                  <TableCell className="text-right">
                    {formatMoney(Number(inv.amount))}
                  </TableCell>
                  <TableCell>
                    {editingStatusId === inv.id ? (
                      <Select
                        value={inv.status}
                        onValueChange={(v) =>
                          handleStatusChange(inv.id, v as Invoice["status"])
                        }
                      >
                        <SelectTrigger className="h-8 w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {(
                            [
                              "draft",
                              "sent",
                              "paid",
                              "overdue",
                              "canceled",
                            ] as const
                          ).map((s) => (
                            <SelectItem key={s} value={s}>
                              {statusLabel[s]}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <Badge
                        variant={statusVariant[inv.status] ?? "secondary"}
                        className="cursor-pointer"
                        onClick={() => setEditingStatusId(inv.id)}
                      >
                        {statusLabel[inv.status] ?? inv.status}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditing(inv);
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(inv.id)}
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
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            { (page - 1) * pageSize + 1 }–{ Math.min(page * pageSize, totalCount) } из { totalCount }
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => {
                const next = new URLSearchParams(window.location.search);
                next.set("page", String(page - 1));
                router.push(`/finances/invoices?${next.toString()}`);
              }}
            >
              Назад
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => {
                const next = new URLSearchParams(window.location.search);
                next.set("page", String(page + 1));
                router.push(`/finances/invoices?${next.toString()}`);
              }}
            >
              Вперёд
            </Button>
          </div>
        </div>
      )}
      <InvoiceFormDialog
        open={open}
        onOpenChange={setOpen}
        invoice={editing}
        onSuccess={() => {
          toast.success(editing ? "Счёт обновлён" : "Счёт создан");
          refresh();
        }}
      />
    </div>
  );
}
