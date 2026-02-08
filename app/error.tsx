"use client";

import { useEffect } from "react";
import { PageHeader } from "@/components/page-header";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="space-y-4">
      <PageHeader title="Ошибка" />
      <div className="rounded-card border border-destructive/50 bg-destructive/10 p-6 text-destructive-foreground">
        <p className="font-medium">Что-то пошло не так</p>
        <p className="mt-2 text-sm opacity-90">
          Проверьте переменные окружения в Vercel (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
          и что в Supabase выполнена схема из <code className="rounded bg-black/10 px-1">supabase/schema.sql</code>.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Попробовать снова
        </button>
      </div>
    </div>
  );
}
