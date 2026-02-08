# Supabase Performance & Security Lints

Лог линтера Supabase (Performance / Security) может показывать предупреждения по этому проекту. Кратко, что они значат и что с ними делать.

## RLS Policy Always True (WARN, SECURITY)

**Что проверяет:** политики RLS с выражениями `USING (true)` и `WITH CHECK (true)` для операций UPDATE, DELETE, INSERT — доступ для роли `anon` фактически не ограничен.

**Где у нас:** политика **"Allow all anon"** на таблицах:

- `calendar_events`, `documents`, `invoice_templates`, `invoices`, `notes`, `notifications`, `salaries`, `tasks`, `transactions`

**Почему так сделано:** приложение задумано как **однопользовательское, без входа**. Чтобы фронт (Next.js) мог читать и писать данные через Supabase anon key, для этих таблиц включён RLS и добавлена одна политика «разрешить всё для anon». Это осознанный выбор, а не ошибка.

**Что делать:**

- **Сейчас:** предупреждение можно **игнорировать** для этого проекта.
- **Когда появится авторизация:** заменить политику «Allow all anon» на политики, привязанные к пользователю, например:
  - `USING (auth.uid() = user_id)` и `WITH CHECK (auth.uid() = user_id)` для таблиц с полем `user_id`;
  - или отдельные политики для `authenticated` вместо `anon`.

Ссылка из отчёта линтера:  
https://supabase.com/docs/guides/database/database-linter?lint=0024_permissive_rls_policy
