"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Document } from "@/lib/types";
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
import { Pencil, Trash2, Plus, FileText } from "lucide-react";

export function DocumentsTable({ documents }: { documents: Document[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [list, setList] = useState<Document[]>(documents);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Document | null>(null);
  const [form, setForm] = useState({ title: "", type: "", related_to: "", file_url: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => setList(documents), [documents]);

  async function fetchList() {
    if (!supabase) return;
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast.error(error.message);
      return;
    }
    setList((data ?? []) as Document[]);
  }

  useEffect(() => {
    if (pathname !== "/documents") return;
    void fetchList();
  }, [pathname, supabase]);

  function openCreate() {
    setFormError(null);
    setEditing(null);
    setForm({ title: "", type: "", related_to: "", file_url: "" });
    setOpen(true);
  }

  function openEdit(d: Document) {
    setFormError(null);
    setEditing(d);
    setForm({
      title: d.title,
      type: d.type,
      related_to: d.related_to ?? "",
      file_url: d.file_url ?? "",
    });
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!supabase) {
      setFormError("Не заданы переменные Supabase. Проверьте Vercel → Environment Variables.");
      return;
    }
    const payload = {
      title: form.title,
      type: form.type || "other",
      related_to: form.related_to || null,
      file_url: form.file_url || null,
    };
    if (editing) {
      const { error } = await updateRow(supabase, "documents", editing.id, payload);
      if (error) {
        setFormError(error.message);
        toast.error(error.message);
        return;
      }
      toast.success("Документ обновлён");
      setOpen(false);
      await fetchList();
      router.refresh();
    } else {
      const { data: inserted, error } = await insertRow(supabase, "documents", payload);
      if (error) {
        setFormError(error.message);
        toast.error(error.message);
        return;
      }
      setOpen(false);
      const row = (inserted ?? null) as Document | null;
      if (row) setList((prev) => [row, ...prev]);
      toast.success("Документ добавлен");
      await fetchList();
      router.refresh();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить документ?")) return;
    if (!supabase) return;
    const { error } = await deleteRow(supabase, "documents", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Документ удалён");
    await fetchList();
    router.refresh();
  }

  return (
    <div className="space-y-2">
      {!supabase && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
          Не заданы переменные Supabase. Vercel → Environment Variables → Redeploy.
        </div>
      )}
      <Button onClick={openCreate} disabled={!supabase}>
        <Plus className="mr-2 h-4 w-4" />
        Добавить
      </Button>
      <div className="rounded-card border border-border/80 bg-card shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Название</TableHead>
              <TableHead>Тип</TableHead>
              <TableHead>Связь</TableHead>
              <TableHead>Дата</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="p-0">
                  <EmptyState
                    icon={FileText}
                    title="Нет документов"
                    action={<Button onClick={openCreate}>Добавить</Button>}
                  />
                </TableCell>
              </TableRow>
            ) : (
              list.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.title}</TableCell>
                  <TableCell>{d.type}</TableCell>
                  <TableCell className="text-muted-foreground">{d.related_to ?? "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {d.created_at ? new Date(d.created_at).toLocaleDateString("ru-RU") : "—"}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(d)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(d.id)}>
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
            <DialogTitle>{editing ? "Редактировать" : "Новый документ"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            {formError && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </div>
            )}
            <div className="space-y-2">
              <Label>Название</Label>
              <Input
                required
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Тип</Label>
              <Input
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                placeholder="договор, акт, и т.д."
              />
            </div>
            <div className="space-y-2">
              <Label>Связь (к чему относится)</Label>
              <Input
                value={form.related_to}
                onChange={(e) => setForm((f) => ({ ...f, related_to: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Ссылка на файл</Label>
              <Input
                value={form.file_url}
                onChange={(e) => setForm((f) => ({ ...f, file_url: e.target.value }))}
                placeholder="https://..."
              />
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
