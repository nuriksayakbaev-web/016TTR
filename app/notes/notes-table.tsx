"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Note | null>(null);
  const [form, setForm] = useState({ content: "" });
  const supabase = createClient();

  function openCreate() {
    setEditing(null);
    setForm({ content: "" });
    setOpen(true);
  }

  function openEdit(n: Note) {
    setEditing(n);
    setForm({ content: n.content });
    setOpen(true);
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = { content: form.content };
    if (editing) {
      const { error } = await updateRow(supabase, "notes", editing.id, payload);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Заметка обновлена");
    } else {
      const { error } = await insertRow(supabase, "notes", payload);
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Заметка добавлена");
    }
    setOpen(false);
    router.refresh();
  }

  async function handleDelete(id: string) {
    if (!confirm("Удалить заметку?")) return;
    const { error } = await deleteRow(supabase, "notes", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Заметка удалена");
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4" /> Добавить</Button>
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
            {notes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="p-0">
                  <EmptyState icon={StickyNote} title="Нет заметок" action={<Button onClick={openCreate}>Добавить</Button>} />
                </TableCell>
              </TableRow>
            ) : (
              notes.map((n) => (
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
