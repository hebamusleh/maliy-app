-- ============================================================
-- Migration 003: No-Auth Compatibility
-- Drops auth.users FK constraints and RLS so the app works
-- without Supabase Auth (anon-user mode).
-- Run AFTER migration 002.
-- ============================================================

-- ─── 1. Drop FK constraints on user_id referencing auth.users ───

-- classification_rules
ALTER TABLE classification_rules
  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE classification_rules
  DROP CONSTRAINT IF EXISTS classification_rules_user_id_fkey;

-- debts
ALTER TABLE debts
  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE debts
  DROP CONSTRAINT IF EXISTS debts_user_id_fkey;

-- alerts
ALTER TABLE alerts
  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE alerts
  DROP CONSTRAINT IF EXISTS alerts_user_id_fkey;

-- chat_messages
ALTER TABLE chat_messages
  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE chat_messages
  DROP CONSTRAINT IF EXISTS chat_messages_user_id_fkey;

-- forecast_snapshots
ALTER TABLE forecast_snapshots
  ALTER COLUMN user_id TYPE TEXT USING user_id::TEXT;
ALTER TABLE forecast_snapshots
  DROP CONSTRAINT IF EXISTS forecast_snapshots_user_id_fkey;

-- ─── 2. Disable RLS on all tables ──────────────────────────

ALTER TABLE projects              DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions          DISABLE ROW LEVEL SECURITY;
ALTER TABLE card_links            DISABLE ROW LEVEL SECURITY;
ALTER TABLE spending_categories   DISABLE ROW LEVEL SECURITY;
ALTER TABLE classification_rules  DISABLE ROW LEVEL SECURITY;
ALTER TABLE debts                 DISABLE ROW LEVEL SECURITY;
ALTER TABLE alerts                DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages         DISABLE ROW LEVEL SECURITY;
ALTER TABLE forecast_snapshots    DISABLE ROW LEVEL SECURITY;
