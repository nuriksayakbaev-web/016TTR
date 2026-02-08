# 016TTR

Микро-ERP для личного использования. Один пользователь, без ролей и команд.

## Стек

- Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui
- Supabase (PostgreSQL)
- SheetJS (xlsx) — экспорт в Excel

## Запуск

```bash
cp .env.example .env.local
# Заполните NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY
npm install
npm run dev
```

В Supabase выполните `supabase/schema.sql`.

## Структура

- **Дашборд** (`/`) — доходы, расходы, неоплаченные счета, ближайшие задачи
- **Счета** (`/finances/invoices`) — полный CRUD, фильтры по статусу и датам, экспорт в Excel
- Остальные разделы — заглушки под ту же схему (документы, транзакции, зарплаты, задачи, заметки, календарь)

Деплой: см. [DEPLOY.md](./DEPLOY.md).
