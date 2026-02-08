-- Invoice templates for auto-generation
CREATE TABLE IF NOT EXISTS invoice_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  period TEXT NOT NULL CHECK (period IN ('monthly', 'quarterly', 'yearly')),
  day_of_month INT NOT NULL CHECK (day_of_month >= 1 AND day_of_month <= 28),
  last_generated_at DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoice_templates_last_generated ON invoice_templates(last_generated_at);

-- Notifications (reminders)
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('invoice', 'task')),
  related_id UUID NOT NULL,
  message TEXT NOT NULL,
  date DATE NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type_related ON notifications(type, related_id);
