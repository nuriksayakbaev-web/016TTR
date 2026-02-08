-- Allow anon to read/write all tables (single-user app, no auth).
-- If "Add" does nothing or inserts fail: Supabase → SQL Editor → run this file.
--
-- Supabase Linter: "RLS Policy Always True" (WARN) — intentional.
-- USING (true) / WITH CHECK (true) bypass RLS for anon; we accept this for
-- a single-user app without auth. When adding real auth, replace with
-- user-scoped policies (e.g. USING (auth.uid() = user_id)).

DO $$
DECLARE
  t text;
  tables text[] := ARRAY['documents','transactions','invoices','salaries','tasks','notes','calendar_events','invoice_templates','notifications'];
BEGIN
  FOREACH t IN ARRAY tables
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS "Allow all anon" ON %I', t);
    EXECUTE format('CREATE POLICY "Allow all anon" ON %I FOR ALL TO anon USING (true) WITH CHECK (true)', t);
  END LOOP;
END $$;
