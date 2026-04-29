# Component Contracts: Project Management System

**Date**: 2026-04-29
**Feature**: specs/001-project-system/spec.md

## Overview

This feature is a client-side web application with no external API contracts. Instead, we define internal component interfaces and data contracts for maintainable code.

## TypeScript Interfaces

```typescript
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
```

## Component Props Contracts

```typescript
// ProjectCard component
export interface ProjectCardProps {
  project: Project;
  stats: ProjectStats;
  onClick: (projectId: string) => void;
}

// ProjectForm component
export interface ProjectFormProps {
  initialData?: Partial<CreateProjectForm>;
  onSubmit: (data: CreateProjectForm) => Promise<void>;
  onCancel: () => void;
}

// ProjectDashboard component
export interface ProjectDashboardProps {
  projectId: string;
  onEditProject: (projectId: string) => void;
  onLinkCard: (projectId: string) => void;
}
```

## API Response Contracts

```typescript
// Supabase query responses
export interface ProjectsResponse {
  data: Project[] | null;
  error: Error | null;
}

export interface ProjectResponse {
  data: Project | null;
  error: Error | null;
}

export interface TransactionsResponse {
  data: Transaction[] | null;
  error: Error | null;
}

export interface DashboardDataResponse {
  data: ProjectDashboard | null;
  error: Error | null;
}
```

## Event Contracts

```typescript
// Custom events for real-time updates
export interface ProjectCreatedEvent {
  type: "project_created";
  project: Project;
}

export interface CardLinkedEvent {
  type: "card_linked";
  cardLink: CardLink;
}

export interface TransactionAssignedEvent {
  type: "transaction_assigned";
  transaction: Transaction;
}
```

## Validation Contracts

```typescript
// Form validation schemas (using Zod)
import { z } from "zod";

export const createProjectSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  icon: z.string().min(1, "Icon is required"),
  type: z.enum(["personal", "business", "freelance"]),
  budget_limit: z.number().positive().optional(),
});

export const linkCardSchema = z.object({
  project_id: z.string().uuid(),
  last4: z.string().regex(/^\d{4}$/, "Must be 4 digits"),
});
```

## Error Contracts

```typescript
// Application error types
export class ProjectError extends Error {
  constructor(
    message: string,
    public code: "NOT_FOUND" | "UNAUTHORIZED" | "VALIDATION" | "NETWORK",
  ) {
    super(message);
    this.name = "ProjectError";
  }
}

// API error responses
export interface ApiError {
  message: string;
  code: string;
  details?: Record<string, any>;
}
```
