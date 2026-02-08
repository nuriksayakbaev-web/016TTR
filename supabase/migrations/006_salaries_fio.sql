-- Добавляем ФИО в зарплаты (первая строка формы).
-- Для существующего проекта: Supabase → SQL Editor → выполнить этот файл.
ALTER TABLE salaries ADD COLUMN IF NOT EXISTS fio TEXT;
