ALTER TABLE tasks ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN NOT NULL DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_tasks_is_urgent ON tasks(is_urgent);
