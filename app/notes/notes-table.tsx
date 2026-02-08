"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Note } from "@/lib/types";
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
import { Pencil, Trash2, Plus, StickyNote } from "lucide-react";

export function NotesTable({ notes }: { notes: Note[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const toast = useToast();
  const [list, setList] = useState<Note[]>(notes);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [form, setForm] = useState({ content: "" });
  const [formError, setFormError] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => setList(notes), [notes]);

  function refresh() {
    router.refresh();
    router.replace(pathname);
  }

  function openCreate() {
    setFormError(null);
    setEditing(null);
    setForm({ content: "" });
    setOpen(true);
  }

  function openEdit(n: Note) {
    setFormError(null);
    setEditing(n);
    setForm({ content: n.content });
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (!supabase) {
      setFormError("Не заданы переменные Supabase (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY). Проверьте настройки в Vercel.");
      return;
    }
    const payload = { content: form.content };
    if (editing) {
      const { error } = await updateRow(supabase, "notes", editing.id, payload);
      if (error) {
        setFormError(error.message);
        toast.error(error.message);
        return;
      }
      toast.success("Заметка обновлена");
      setOpen(false);
      refresh();
    } else {
      const { data: inserted, error } = await insertRow(supabase, "notes", payload);
      if (error) {
        setFormError(error.message);
        toast.error(error.message);
        return;
      }
      setOpen(false);
      const row = (inserted ?? null) as Note | null;
      if (row) setList((prev) => [row, ...prev]);
      toast.success("Заметка добавлена");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить заметку?")) return;
    if (!supabase) return;
    const { error } = await deleteRow(supabase, "notes", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Заметка удалена");
    setList((prev) => prev.filter((n) => n.id !== id));
  }

  return (
    <div className="space-y-2">
      {!supabase && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
          Не заданы переменные Supabase. Добавьте NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY в Vercel → Environment Variables и сделайте Redeploy.
        </div>
      )}
      <Button onClick={openCreate} disabled={!supabase}><Plus className="mr-2 h-4 w-4" /> Добавить</Button>
      <div className="rounded-card border border-border/80 bg-card shadow-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Содержание</TableHead>
              <TableHead>Дата</TableHead>
              <TableHead className="w-[80px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {list.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="p-0">
                  <EmptyState icon={StickyNote} title="Нет заметок" action={<Button onClick={openCreate}>Добавить</Button>} />
                </TableCell>
              </TableRow>
            ) : (
              list.map((n) => (
                <TableRow key={n.id}>
                  <TableCell className="max-w-md truncate font-medium">{n.content}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(n.created_at).toLocaleDateString("ru-RU")}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(n)}><Pencil className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(n.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
            <DialogTitle>{editing ? "Редактировать заметку" : "Новая заметка"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={submit} className="space-y-4">
            {formError && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {formError}
              </div>
            )}
            <div className="space-y-2">
              <Label>Содержание</Label>
              <Input required value={form.content} onChange={(e) => setForm({ content: e.target.value })} />
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
