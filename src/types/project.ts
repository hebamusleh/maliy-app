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

export interface CardLink {
  id: string;
  user_id: string;
  project_id: string;
  last4: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  project_id: string;
  amount: number;
  currency: string;
  merchant?: string;
  date: string;
  created_at: string;
  updated_at: string;
}

// Form types
export interface CreateProjectForm {
  name: string;
  icon: string;
  type: Project["type"];
  budget_limit?: number;
}

export interface LinkCardForm {
  project_id: string;
  last4: string;
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
