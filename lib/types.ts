export type InvoiceStatus = "draft" | "sent" | "paid" | "overdue" | "canceled";

export interface Invoice {
  id: string;
  invoice_number: string;
  client_name: string;
  issue_date: string;
  due_date: string;
  amount: number;
  status: InvoiceStatus;
  comment: string | null;
  created_at?: string;
}

export interface Document {
  id: string;
  title: string;
  type: string;
  related_to: string | null;
  file_url: string | null;
  created_at: string;
}

export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  date: string;
  comment: string | null;
  created_at?: string;
}

export interface Salary {
  id: string;
  month: string;
  base: number;
  bonus: number;
  penalty: number;
  total: number;
  paid: boolean;
  created_at?: string;
}

export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string | null;
  is_urgent: boolean;
  created_at?: string;
}

export interface Note {
  id: string;
  content: string;
  created_at: string;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  related_type: "task" | "invoice" | "salary" | "custom";
  related_id: string | null;
  created_at?: string;
}

export type InvoiceTemplatePeriod = "monthly" | "quarterly" | "yearly";

export interface InvoiceTemplate {
  id: string;
  client_name: string;
  amount: number;
  period: InvoiceTemplatePeriod;
  day_of_month: number;
  last_generated_at: string | null;
  created_at?: string;
}

export type NotificationType = "invoice" | "task";

export interface Notification {
  id: string;
  type: NotificationType;
  related_id: string;
  message: string;
  date: string;
  read: boolean;
  created_at?: string;
}
