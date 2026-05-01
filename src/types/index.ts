// ============================================================
// ماليّ — Core Type Definitions
// ============================================================

export type { Project, CardLink, Transaction, CreateProjectForm, LinkCardForm, ProjectStats, ProjectDashboard } from "./project";

// ─── Spending Categories ────────────────────────────────────
export interface SpendingCategory {
  id: string;
  name_ar: string;
  name_en: string;
  icon: string;
  color: string;
}

// ─── Classification Rule ────────────────────────────────────
export interface ClassificationRule {
  id: string;
  user_id: string;
  merchant_pattern: string;
  project_id: string;
  category_id: string | null;
  confirmation_count: number;
  created_at: string;
  updated_at: string;
}

// ─── Debt ───────────────────────────────────────────────────
export interface Debt {
  id: string;
  user_id: string;
  debtor_name: string;
  direction: "owed_by_me" | "owed_to_me";
  total_amount: number;
  remaining_amount: number;
  due_date: string | null;
  notes: string | null;
  is_urgent: boolean;
  is_interest_free: boolean;
  created_at: string;
  updated_at: string;
}

export interface DebtSummary {
  total_owed_by_me: number;
  total_owed_to_me: number;
  net: number;
  monthly_repayment_rate: number;
}

// ─── Alerts ─────────────────────────────────────────────────
export type AlertType = "urgent" | "recommendation" | "reminder" | "achievement";

export interface Alert {
  id: string;
  user_id: string;
  type: AlertType;
  title: string;
  body: string;
  action_type: "navigate" | "confirm" | "dismiss-only" | null;
  action_payload: Record<string, unknown> | null;
  dismissed: boolean;
  created_at: string;
}

export interface AlertCounts {
  all: number;
  urgent: number;
  recommendation: number;
  reminder: number;
  achievement: number;
}

// ─── Chat ────────────────────────────────────────────────────
export interface TxReceiptCard {
  type: "tx_receipt";
  transaction_id: string | null;  // null = pending (not yet confirmed)
  merchant: string;
  amount: number;
  category: string;               // Arabic label e.g. "مطاعم"
  confidence: number;             // 0–100 integer
  suggestions: Array<{ label: string; project_id: string }>;
  status: "pending" | "confirmed" | "deleted";
}

export interface ChipsCard {
  type: "chips";
  chips: Array<{ label: string; action: string; payload?: unknown }>;
}

export interface InsightCard {
  type: "insight";
  pattern: "repeated_merchant" | "budget_warning" | "anomaly";
  action_label: string;
  action_payload: Record<string, unknown>;
}

export type RichCard = TxReceiptCard | ChipsCard | InsightCard;

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  rich_card: RichCard | null;
  created_at: string;
}

// ─── Forecast ────────────────────────────────────────────────
export interface ForecastSnapshot {
  id: string;
  user_id: string;
  horizon_days: 7 | 30 | 90;
  pessimistic: number;
  likely: number;
  optimistic: number;
  daily_balances: Array<{ date: string; balance: number }>;
  danger_zones: Array<{
    start_date: string;
    end_date: string;
    min_balance: number;
  }> | null;
  upcoming_events: Array<{
    type: "income" | "expense" | "subscription";
    label: string;
    amount: number;
    date: string;
  }> | null;
  generated_at: string;
}

// ─── Dashboard ───────────────────────────────────────────────
export interface ProjectSummary {
  project: import("./project").Project;
  spend: number;
  budget_used_pct: number;
  remaining: number;
  transaction_count: number;
}

export interface DashboardData {
  /** ISO currency code of the user's chosen base currency (e.g. "SAR", "USD") */
  currency: string;
  balance: number;
  income: number;
  expenses: number;
  savings: number;
  balance_change_pct: number;
  pending_count: number;
  projects: ProjectSummary[];
  recent_alerts: Alert[];
}

// ─── Analytics ───────────────────────────────────────────────
export interface CategorySpend {
  category: SpendingCategory;
  amount: number;
  pct: number;
}

export interface ProjectDistribution {
  project: import("./project").Project;
  amount: number;
  pct: number;
}

export interface DailySpend {
  date: string;
  amount: number;
}

export interface AnalyticsData {
  /** ISO currency code of the user's chosen base currency */
  currency: string;
  income: number;
  expenses: number;
  daily_average: number;
  savings_rate: number;
  income_change_pct: number;
  expenses_change_pct: number;
  categories: CategorySpend[];
  project_distribution: ProjectDistribution[];
  daily_spend: DailySpend[];
}

// ─── Pagination ──────────────────────────────────────────────
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
