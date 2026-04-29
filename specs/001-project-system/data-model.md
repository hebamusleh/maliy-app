# Data Model: Project Management System

**Date**: 2026-04-29
**Feature**: specs/001-project-system/spec.md

## Overview

The project management system requires three core entities: Projects, CardLinks, and Transactions. All data is stored in Supabase PostgreSQL with Row Level Security enabled.

## Entities

### Project

Represents a financial container for organizing transactions.

**Fields**:

- `id`: UUID (primary key)
- `user_id`: UUID (foreign key to auth.users, RLS)
- `name`: VARCHAR(100) (required, user-defined)
- `icon`: VARCHAR(50) (emoji or icon identifier)
- `type`: ENUM('personal', 'business', 'freelance') (required)
- `budget_limit`: DECIMAL(12,2) (optional, soft limit)
- `created_at`: TIMESTAMP (auto)
- `updated_at`: TIMESTAMP (auto)

**Validation Rules**:

- Name cannot be empty
- Budget limit must be positive if provided
- Type must be one of the allowed values

**Relationships**:

- One-to-many with CardLink
- One-to-many with Transaction

### CardLink

Links a bank card's last 4 digits to a specific project for auto-assignment.

**Fields**:

- `id`: UUID (primary key)
- `user_id`: UUID (foreign key to auth.users, RLS)
- `project_id`: UUID (foreign key to projects)
- `last4`: CHAR(4) (required, digits only)
- `created_at`: TIMESTAMP (auto)

**Validation Rules**:

- last4 must be exactly 4 digits
- Unique per user (no duplicate cards)
- Project must exist and belong to user

**Relationships**:

- Many-to-one with Project

### Transaction

Represents a financial transaction belonging to exactly one project.

**Fields**:

- `id`: UUID (primary key)
- `user_id`: UUID (foreign key to auth.users, RLS)
- `project_id`: UUID (foreign key to projects, required)
- `amount`: DECIMAL(12,2) (required, positive for income, negative for expenses)
- `currency`: VARCHAR(3) (default 'SAR')
- `merchant`: VARCHAR(200) (optional)
- `date`: DATE (required)
- `created_at`: TIMESTAMP (auto)
- `updated_at`: TIMESTAMP (auto)

**Validation Rules**:

- Amount cannot be zero
- Project must exist and belong to user
- Date cannot be in future

**Relationships**:

- Many-to-one with Project

## Database Schema

```sql
-- Projects table
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  type project_type NOT NULL,
  budget_limit DECIMAL(12,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Card links table
CREATE TABLE card_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  last4 CHAR(4) NOT NULL CHECK (last4 ~ '^\d{4}$'),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, last4)
);

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  amount DECIMAL(12,2) NOT NULL CHECK (amount != 0),
  currency VARCHAR(3) DEFAULT 'SAR',
  merchant VARCHAR(200),
  date DATE NOT NULL CHECK (date <= CURRENT_DATE),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_projects_user_id ON projects(user_id);
CREATE INDEX idx_card_links_user_id ON card_links(user_id);
CREATE INDEX idx_card_links_project_id ON card_links(project_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_project_id ON transactions(project_id);
CREATE INDEX idx_transactions_date ON transactions(date);

-- Row Level Security
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

-- Similar policies for card_links and transactions
```

## State Transitions

### Project Lifecycle

- **Created**: Initial state with basic info
- **Active**: Has transactions and/or linked cards
- **Archived**: Soft delete, hidden from UI but data preserved

### Transaction Assignment

- **Unassigned**: New transaction without project
- **Auto-assigned**: Assigned via card linking rules
- **Manually assigned**: User explicitly assigns
- **Confirmed**: User confirms auto-assignment

## Data Flow

1. User creates project → stored in projects table
2. User links card → stored in card_links table
3. Transaction imported → auto-assigned to project via card last4 → stored in transactions table
4. Dashboard queries aggregate transaction data per project
