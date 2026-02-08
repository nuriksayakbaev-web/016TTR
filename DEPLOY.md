# Деплой 016TTR (Vercel + Supabase Free)

## Supabase

1. Создайте проект на [supabase.com](https://supabase.com) (Free tier).
2. В SQL Editor выполните содержимое `supabase/schema.sql`.
3. Settings → API: скопируйте **Project URL** и **anon public** key.

## Локальная разработка

```bash
cp .env.example .env.local
# Заполните NEXT_PUBLIC_SUPABASE_URL и NEXT_PUBLIC_SUPABASE_ANON_KEY в .env.local
npm install
npm run dev
```

## Vercel

1. Подключите репозиторий Git к Vercel.
2. В настройках проекта добавьте переменные окружения:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy. На бесплатном плане Vercel хватает для одного пользователя.

## Ограничения бесплатного тарифа

- **Vercel**: 100 GB bandwidth/мес, serverless execution limits.
- **Supabase**: 500 MB БД, 1 GB file storage, 2 проекта. Для одного пользователя достаточно.
- Рекомендация: не включать RLS (приложение персональное), использовать anon key без доп. auth.

## Git

```bash
git init
git add .
git commit -m "Initial 016TTR"
git remote add origin <your-repo-url>
git push -u origin main
```
