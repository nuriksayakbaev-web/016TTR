"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const statuses = [
  { value: "all", label: "Все статусы" },
  { value: "draft", label: "Черновик" },
  { value: "sent", label: "Отправлен" },
  { value: "paid", label: "Оплачен" },
  { value: "overdue", label: "Просрочен" },
  { value: "canceled", label: "Отменён" },
];

export function InvoiceFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const status = searchParams.get("status") ?? "all";
  const from = searchParams.get("from") ?? "";
  const to = searchParams.get("to") ?? "";

  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(searchParams.toString());
    if (!value || value === "all") next.delete(key);
    else next.set(key, value);
    next.delete("page");
    router.push(`/finances/invoices?${next.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={status} onValueChange={(v) => setFilter("status", v)}>
        <SelectTrigger className="w-[180px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statuses.map((s) => (
            <SelectItem key={s.value} value={s.value}>
              {s.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        type="date"
        placeholder="От"
        className="w-[140px]"
        value={from}
        onChange={(e) => setFilter("from", e.target.value)}
      />
      <Input
        type="date"
        placeholder="До"
        className="w-[140px]"
        value={to}
        onChange={(e) => setFilter("to", e.target.value)}
      />
      {(status !== "all" || from || to) && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => router.push("/finances/invoices")}
        >
          Сбросить
        </Button>
      )}
    </div>
  );
}
