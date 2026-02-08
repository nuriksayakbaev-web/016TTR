import { PageHeader } from "@/components/page-header";

export function EnvRequired() {
  return (
    <div className="space-y-4">
      <PageHeader title="Настройка" />
      <div className="rounded-card border border-amber-200 bg-amber-50 p-6 text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
        <p className="font-medium">Не заданы переменные окружения Supabase</p>
        <p className="mt-2 text-sm opacity-90">
          В Vercel → Project → Settings → Environment Variables добавьте:
        </p>
        <ul className="mt-2 list-inside list-disc text-sm">
          <li><code className="rounded bg-amber-200/50 px-1 dark:bg-amber-900/50">NEXT_PUBLIC_SUPABASE_URL</code> — Project URL из Supabase</li>
          <li><code className="rounded bg-amber-200/50 px-1 dark:bg-amber-900/50">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> — anon public key из Supabase</li>
        </ul>
        <p className="mt-3 text-sm">После сохранения переменных выполните повторный деплой (Redeploy).</p>
      </div>
    </div>
  );
}
