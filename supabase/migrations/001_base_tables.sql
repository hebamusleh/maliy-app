-- ============================================================
-- Migration 001: ماليّ Base Tables
-- Run this in Supabase SQL Editor BEFORE migration 002
-- ============================================================

-- ─── 1. projects ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL,
  name         TEXT NOT NULL,
  icon         TEXT NOT NULL DEFAULT '📁',
  type         TEXT NOT NULL CHECK (type IN ('personal','business','freelance')),
  budget_limit DECIMAL(12,2),
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_projects_user
  ON projects(user_id);

-- ─── 2. transactions ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  amount     DECIMAL(12,2) NOT NULL,
  currency   TEXT NOT NULL DEFAULT 'SAR',
  merchant   TEXT,
  date       DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_transactions_user
  ON transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_transactions_project
  ON transactions(project_id);

-- ─── 3. card_links ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS card_links (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT NOT NULL,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  last4      TEXT NOT NULL CHECK (last4 ~ '^[0-9]{4}$'),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (project_id, last4)
);

CREATE INDEX IF NOT EXISTS idx_card_links_project
  ON card_links(project_id);
