import type { SupabaseClient } from "@supabase/supabase-js";
import type { InvoiceTemplate } from "./types";

const today = () => new Date().toISOString().slice(0, 10);

function getNextGenerateDate(
  last: string | null,
  period: InvoiceTemplate["period"],
  dayOfMonth: number
): string {
  const now = new Date();
  let next: Date;
  if (!last) {
    next = new Date(now.getFullYear(), now.getMonth(), Math.min(dayOfMonth, 28));
    if (next <= now) next.setMonth(next.getMonth() + 1);
  } else {
    const lastDate = new Date(last);
    next = new Date(lastDate);
    if (period === "monthly") next.setMonth(next.getMonth() + 1);
    else if (period === "quarterly") next.setMonth(next.getMonth() + 3);
    else next.setFullYear(next.getFullYear() + 1);
    next.setDate(Math.min(dayOfMonth, 28));
  }
  return next.toISOString().slice(0, 10);
}

export async function runInvoiceTemplates(supabase: SupabaseClient): Promise<void> {
  const { data: templates, error: fetchErr } = await supabase
    .from("invoice_templates")
    .select("*");
  if (fetchErr || !templates?.length) return;

  const todayStr = today();
  for (const t of templates as InvoiceTemplate[]) {
    const nextDate = getNextGenerateDate(t.last_generated_at, t.period, t.day_of_month);
    if (todayStr < nextDate) continue;

    const issueDate = todayStr;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30);
    const dueStr = dueDate.toISOString().slice(0, 10);
    const invoiceNumber = `AUTO-${t.id.slice(0, 8)}-${todayStr.replace(/-/g, "")}`;

    const { error: insertErr } = await supabase.from("invoices").insert({
      invoice_number: invoiceNumber,
      client_name: t.client_name,
      issue_date: issueDate,
      due_date: dueStr,
      amount: t.amount,
      status: "draft",
      comment: null,
    });
    if (insertErr) continue;

    await supabase
      .from("invoice_templates")
      .update({ last_generated_at: todayStr })
      .eq("id", t.id);
  }
}

export async function runOverdueUpdate(supabase: SupabaseClient): Promise<void> {
  const todayStr = today();
  await supabase
    .from("invoices")
    .update({ status: "overdue" })
    .lt("due_date", todayStr)
    .in("status", ["draft", "sent"]);
}

export async function syncNotifications(supabase: SupabaseClient): Promise<void> {
  const todayStr = today();
  const in7 = new Date();
  in7.setDate(in7.getDate() + 7);
  const in7Str = in7.toISOString().slice(0, 10);

  const { data: unpaid } = await supabase
    .from("invoices")
    .select("id, invoice_number, client_name, due_date")
    .in("status", ["draft", "sent", "overdue"]);

  const { data: tasksDue } = await supabase
    .from("tasks")
    .select("id, title, deadline")
    .in("status", ["todo", "in_progress"])
    .lte("deadline", in7Str)
    .not("deadline", "is", null);

  const { data: existing } = await supabase.from("notifications").select("type, related_id");

  const existingSet = new Set(
    (existing ?? []).map((r) => `${r.type}:${r.related_id}`)
  );

  const toInsert: { type: string; related_id: string; message: string; date: string }[] = [];

  for (const inv of unpaid ?? []) {
    const key = `invoice:${inv.id}`;
    if (existingSet.has(key)) continue;
    toInsert.push({
      type: "invoice",
      related_id: inv.id,
      message: `Счёт ${(inv as { invoice_number: string }).invoice_number} (${(inv as { client_name: string }).client_name}) — не оплачен`,
      date: (inv as { due_date: string }).due_date,
    });
  }

  for (const task of tasksDue ?? []) {
    const key = `task:${task.id}`;
    if (existingSet.has(key)) continue;
    const d = (task as { deadline: string }).deadline;
    const msg =
      d < todayStr
        ? `Задача «${(task as { title: string }).title}» — просрочена`
        : `Задача «${(task as { title: string }).title}» — дедлайн ${d}`;
    toInsert.push({
      type: "task",
      related_id: task.id,
      message: msg,
      date: d,
    });
  }

  if (toInsert.length) {
    await supabase.from("notifications").insert(toInsert);
  }

  const { data: paidInvoices } = await supabase
    .from("invoices")
    .select("id")
    .eq("status", "paid");
  const paidIds = (paidInvoices ?? []).map((r) => r.id);
  const { data: doneTasks } = await supabase
    .from("tasks")
    .select("id")
    .eq("status", "done");
  const doneIds = (doneTasks ?? []).map((r) => r.id);
  if (paidIds.length)
    await supabase.from("notifications").update({ read: true }).eq("type", "invoice").in("related_id", paidIds);
  if (doneIds.length)
    await supabase.from("notifications").update({ read: true }).eq("type", "task").in("related_id", doneIds);
}
