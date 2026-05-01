-- ============================================================
-- Migration 005: Fix chat_messages table
-- Drops and recreates the table cleanly without user_id.
-- Migration 002 left the table in a broken state (index and
-- policy referenced a non-existent user_id column).
-- ============================================================

DROP TABLE IF EXISTS chat_messages;

CREATE TABLE chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role       TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content    TEXT NOT NULL,
  rich_card  JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- App runs without Supabase Auth — RLS is not needed
ALTER TABLE chat_messages DISABLE ROW LEVEL SECURITY;

CREATE INDEX idx_chat_recent ON chat_messages(created_at DESC);
