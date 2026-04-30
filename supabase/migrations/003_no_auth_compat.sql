-- ============================================================
-- Migration 003: No-Auth Compatibility
-- Disables RLS so the app works without Supabase Auth (anon-user mode).
-- Run AFTER migration 002.
-- ============================================================

-- ─── Disable RLS on all tables ──────────────────────────

ALTER TABLE projects              DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions          DISABLE ROW LEVEL SECURITY;
ALTER TABLE card_links            DISABLE ROW LEVEL SECURITY;
ALTER TABLE spending_categories   DISABLE ROW LEVEL SECURITY;
ALTER TABLE classification_rules  DISABLE ROW LEVEL SECURITY;
ALTER TABLE debts                 DISABLE ROW LEVEL SECURITY;
ALTER TABLE alerts                DISABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages         DISABLE ROW LEVEL SECURITY;
ALTER TABLE forecast_snapshots    DISABLE ROW LEVEL SECURITY;
