-- ============================================================
-- Migration 007: User Settings
-- Stores per-user preferences. Starts with base_currency.
-- ============================================================

CREATE TABLE IF NOT EXISTS user_settings (
  user_id       TEXT PRIMARY KEY,
  base_currency TEXT NOT NULL DEFAULT 'SAR',
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_settings DISABLE ROW LEVEL SECURITY;

-- Seed default settings for the anonymous user
INSERT INTO user_settings (user_id, base_currency)
VALUES ('anon-user', 'SAR')
ON CONFLICT (user_id) DO NOTHING;
