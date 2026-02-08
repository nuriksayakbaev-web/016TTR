import type { SupabaseClient } from "@supabase/supabase-js";

export type TableName =
  | "documents"
  | "transactions"
  | "invoices"
  | "salaries"
  | "tasks"
  | "notes"
  | "calendar_events"
  | "invoice_templates"
  | "notifications";

export interface SelectOptions {
  orderBy?: string;
  ascending?: boolean;
  range?: { from: number; to: number };
  filters?: Record<string, string | string[]>;
}

export interface Result<T> {
  data: T[] | null;
  error: Error | null;
  count?: number;
}

function logError(table: string, op: string, err: unknown) {
  const msg = err instanceof Error ? err.message : String(err);
  console.error(`[016TTR] ${table}.${op}:`, msg);
}

export async function selectTable<T>(
  supabase: SupabaseClient,
  table: TableName,
  options: SelectOptions = {}
): Promise<Result<T>> {
  try {
    let q = supabase.from(table).select("*", { count: "exact", head: true });
    if (options.orderBy) {
      q = q.order(options.orderBy, { ascending: options.ascending ?? false });
    }
    if (options.filters) {
      for (const [key, value] of Object.entries(options.filters)) {
        if (value === undefined || value === "" || value === "all") continue;
        if (Array.isArray(value)) q = q.in(key, value);
        else q = q.eq(key, value);
      }
    }
    if (options.range) {
      q = q.range(options.range.from, options.range.to);
    }
    const { data, error, count } = await q;
    if (error) {
      logError(table, "select", error);
      return { data: null, error: new Error(error.message), count: undefined };
    }
    return { data: (data ?? []) as T[], error: null, count: count ?? undefined };
  } catch (e) {
    logError(table, "select", e);
    return {
      data: null,
      error: e instanceof Error ? e : new Error(String(e)),
    };
  }
}

export async function selectCount(
  supabase: SupabaseClient,
  table: TableName,
  filters?: Record<string, string | string[]>
): Promise<{ count: number; error: Error | null }> {
  try {
    let q = supabase.from(table).select("*", { count: "exact", head: true });
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (value === undefined || value === "" || value === "all") continue;
        if (Array.isArray(value)) q = q.in(key, value);
        else q = q.eq(key, value);
      }
    }
    const { count, error } = await q;
    if (error) {
      logError(table, "count", error);
      return { count: 0, error: new Error(error.message) };
    }
    return { count: count ?? 0, error: null };
  } catch (e) {
    logError(table, "count", e);
    return {
      count: 0,
      error: e instanceof Error ? e : new Error(String(e)),
    };
  }
}

export async function insertRow<T extends Record<string, unknown>>(
  supabase: SupabaseClient,
  table: TableName,
  row: T
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.from(table).insert(row).select().single();
    if (error) {
      logError(table, "insert", error);
      return { data: null, error: new Error(error.message) };
    }
    return { data: data as T, error: null };
  } catch (e) {
    logError(table, "insert", e);
    return {
      data: null,
      error: e instanceof Error ? e : new Error(String(e)),
    };
  }
}

export async function updateRow(
  supabase: SupabaseClient,
  table: TableName,
  id: string,
  patch: Record<string, unknown>
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.from(table).update(patch).eq("id", id);
    if (error) {
      logError(table, "update", error);
      return { error: new Error(error.message) };
    }
    return { error: null };
  } catch (e) {
    logError(table, "update", e);
    return {
      error: e instanceof Error ? e : new Error(String(e)),
    };
  }
}

export async function deleteRow(
  supabase: SupabaseClient,
  table: TableName,
  id: string
): Promise<{ error: Error | null }> {
  try {
    const { error } = await supabase.from(table).delete().eq("id", id);
    if (error) {
      logError(table, "delete", error);
      return { error: new Error(error.message) };
    }
    return { error: null };
  } catch (e) {
    logError(table, "delete", e);
    return {
      error: e instanceof Error ? e : new Error(String(e)),
    };
  }
}
