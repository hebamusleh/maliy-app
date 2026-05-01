// Core entity types
export interface Project {
  id: string;
  user_id: string;
  name: string;
  icon: string;
  type: "personal" | "business" | "freelance";
  budget_limit?: number;
  created_at: string;
  updated_at: string;
}

export type CardNetwork = "Visa" | "Mastercard" | "Mada" | "Amex" | "Other";
export type CardType = "credit" | "debit";

export interface CardLink {
  id: string;
  user_id: string;
  project_id: string;
  last4: string;
  cardholder_name: string | null;
  expiry_month: number | null;
  expiry_year: number | null;
  bank_name: string | null;
  card_network: CardNetwork | null;
  card_type: CardType;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  project_id: string | null;
  amount: number;
  currency: string;
  merchant: string | null;
  date: string;
  status: "classified" | "pending" | "skipped";
  confidence_score: number | null;
  ai_reasoning: string | null;
  payment_last4: string | null;
  transaction_time: string | null;
  category_id: string | null;
  notes: string | null;
  classified_at: string | null;
  created_at: string;
  updated_at: string;
}

// Form types
export interface CreateProjectForm {
  name: string;
  icon: string;
  type: Project["type"];
  // Optional card to link during project creation
  card_last4?: string;
  card_cardholder_name?: string;
  card_expiry_month?: number;
  card_expiry_year?: number;
  card_bank_name?: string;
  card_network?: CardNetwork;
  card_type?: CardType;
}

export interface LinkCardForm {
  project_id: string;
  last4: string;
  cardholder_name?: string;
  expiry_month?: number;
  expiry_year?: number;
  bank_name?: string;
  card_network?: CardNetwork;
  card_type?: CardType;
}

export interface CreateTransactionForm {
  merchant: string;
  amount: number;
  date: string;
  transaction_time?: string;
  payment_last4?: string;
  notes?: string;
  project_id: string;
}

// Dashboard data types
export interface ProjectStats {
  total_income: number;
  total_expenses: number;
  net_profit: number;
  transaction_count: number;
  budget_used_percentage?: number;
}

export interface ProjectDashboard {
  project: Project;
  stats: ProjectStats;
  recent_transactions: Transaction[];
  insights: string[];
}
