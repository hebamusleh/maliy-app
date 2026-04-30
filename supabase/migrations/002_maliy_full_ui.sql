-- ============================================================
-- Migration 002: ماليّ Full UI Implementation
-- Run this in Supabase SQL Editor after migration 001
-- ============================================================

-- ─── 1. spending_categories (global lookup) ────────────────
CREATE TABLE IF NOT EXISTS spending_categories (
  id      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar TEXT NOT NULL UNIQUE,
  name_en TEXT NOT NULL UNIQUE,
  icon    TEXT NOT NULL,
  color   TEXT NOT NULL DEFAULT '#C8853A'
);

INSERT INTO spending_categories (name_ar, name_en, icon, color) VALUES
  ('مطاعم وطعام',    'Restaurants',    '🍽️', '#C8853A'),
  ('تسوق',           'Shopping',       '🛒', '#B85C5C'),
  ('مواصلات ووقود', 'Transportation', '⛽', '#0E1B2C'),
  ('اشتراكات',       'Subscriptions',  '📱', '#6B8E6B'),
  ('فواتير',         'Utilities',      '💡', '#9c7ab8'),
  ('ترفيه',          'Entertainment',  '🎬', '#5b8bc9'),
  ('صحة',            'Health',         '🏥', '#e07b7b'),
  ('تعليم',          'Education',      '📚', '#7bae7b'),
  ('أخرى',           'Other',          '🎯', '#c9a97a')
ON CONFLICT (name_ar) DO NOTHING;

-- ─── 2. Extend transactions table ─────────────────────────
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS status            TEXT NOT NULL DEFAULT 'pending'
                                             CHECK (status IN ('classified','pending','skipped')),
  ADD COLUMN IF NOT EXISTS confidence_score  FLOAT CHECK (confidence_score BETWEEN 0 AND 1),
  ADD COLUMN IF NOT EXISTS ai_reasoning      TEXT,
  ADD COLUMN IF NOT EXISTS payment_last4     TEXT CHECK (payment_last4 ~ '^[0-9]{4}$' OR payment_last4 IS NULL),
  ADD COLUMN IF NOT EXISTS transaction_time  TIME,
  ADD COLUMN IF NOT EXISTS category_id       UUID REFERENCES spending_categories(id),
  ADD COLUMN IF NOT EXISTS notes             TEXT,
  ADD COLUMN IF NOT EXISTS classified_at     TIMESTAMPTZ;

-- Back-fill existing classified transactions
UPDATE transactions SET status = 'classified' WHERE project_id IS NOT NULL AND status = 'pending';

CREATE INDEX IF NOT EXISTS idx_transactions_pending
  ON transactions(user_id, status) WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_transactions_date
  ON transactions(user_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_merchant
  ON transactions(user_id, LOWER(merchant));

-- ─── 3. classification_rules ───────────────────────────────
CREATE TABLE IF NOT EXISTS classification_rules (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id            TEXT NOT NULL,
  merchant_pattern   TEXT NOT NULL,
  project_id         UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category_id        UUID REFERENCES spending_categories(id),
  confirmation_count INT NOT NULL DEFAULT 1,
  created_at         TIMESTAMPTZ DEFAULT NOW(),
  updated_at         TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, merchant_pattern)
);

ALTER TABLE classification_rules ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users own their rules" ON classification_rules;
CREATE POLICY "Users own their rules"
  ON classification_rules FOR ALL USING (auth.uid()::text = user_id);

CREATE INDEX IF NOT EXISTS idx_rules_merchant
  ON classification_rules(user_id, merchant_pattern);

-- ─── 4. debts ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS debts (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          TEXT NOT NULL,
  debtor_name      TEXT NOT NULL,
  direction        TEXT NOT NULL CHECK (direction IN ('owed_by_me','owed_to_me')),
  total_amount     DECIMAL(12,2) NOT NULL CHECK (total_amount > 0),
  remaining_amount DECIMAL(12,2) NOT NULL CHECK (remaining_amount >= 0),
  due_date         DATE,
  notes            TEXT,
  is_urgent        BOOLEAN NOT NULL DEFAULT FALSE,
  is_interest_free BOOLEAN NOT NULL DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users own their debts" ON debts;
CREATE POLICY "Users own their debts"
  ON debts FOR ALL USING (auth.uid()::text = user_id);

-- ─── 5. alerts ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS alerts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        TEXT NOT NULL,
  type           TEXT NOT NULL CHECK (type IN ('urgent','recommendation','reminder','achievement')),
  title          TEXT NOT NULL,
  body           TEXT NOT NULL,
  action_type    TEXT CHECK (action_type IN ('navigate','confirm','dismiss-only') OR action_type IS NULL),
  action_payload JSONB,
  dismissed      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users own their alerts" ON alerts;
CREATE POLICY "Users own their alerts"
  ON alerts FOR ALL USING (auth.uid()::text = user_id);

CREATE INDEX IF NOT EXISTS idx_alerts_active
  ON alerts(user_id, dismissed, created_at DESC) WHERE dismissed = FALSE;

-- ─── 6. chat_messages ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT NOT NULL,
  role       TEXT NOT NULL CHECK (role IN ('user','assistant')),
  content    TEXT NOT NULL,
  rich_card  JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users own their messages" ON chat_messages;
CREATE POLICY "Users own their messages"
  ON chat_messages FOR ALL USING (auth.uid()::text = user_id);

CREATE INDEX IF NOT EXISTS idx_chat_recent
  ON chat_messages(user_id, created_at DESC);

-- ─── 7. forecast_snapshots ────────────────────────────────
CREATE TABLE IF NOT EXISTS forecast_snapshots (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         TEXT NOT NULL,
  horizon_days    INT NOT NULL CHECK (horizon_days IN (7,30,90)),
  pessimistic     DECIMAL(12,2) NOT NULL,
  likely          DECIMAL(12,2) NOT NULL,
  optimistic      DECIMAL(12,2) NOT NULL,
  daily_balances  JSONB NOT NULL DEFAULT '[]',
  danger_zones    JSONB,
  upcoming_events JSONB,
  generated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, horizon_days)
);

ALTER TABLE forecast_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users own their forecasts" ON forecast_snapshots;
CREATE POLICY "Users own their forecasts"
  ON forecast_snapshots FOR ALL USING (auth.uid()::text = user_id);

-- ─── 8. transaction_graph view (Knowledge Graph) ──────────
CREATE OR REPLACE VIEW transaction_graph AS
SELECT
  t.id                AS transaction_id,
  t.user_id,
  t.merchant,
  t.amount,
  t.date,
  t.status,
  t.confidence_score,
  p.id                AS project_id,
  p.name              AS project_name,
  p.type              AS project_type,
  sc.id               AS category_id,
  sc.name_ar          AS category_name,
  sc.icon             AS category_icon,
  cr.id               AS rule_id,
  cr.confirmation_count
FROM transactions t
LEFT JOIN projects p            ON t.project_id = p.id
LEFT JOIN spending_categories sc ON t.category_id = sc.id
LEFT JOIN classification_rules cr
  ON LOWER(t.merchant) = cr.merchant_pattern AND cr.user_id = t.user_id;

-- ─── 9. monthly_summary view (Analytics) ──────────────────
CREATE OR REPLACE VIEW monthly_summary AS
SELECT
  user_id,
  DATE_TRUNC('month', date::TIMESTAMPTZ) AS month,
  project_id,
  SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END)      AS income,
  SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) AS expenses,
  COUNT(*)                                               AS transaction_count
FROM transactions
WHERE status = 'classified'
GROUP BY user_id, month, project_id;

-- ─── 10. Existing transactions RLS (ensure it exists) ─────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'transactions' AND policyname = 'Users own their transactions'
  ) THEN
    ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users own their transactions"
      ON transactions FOR ALL USING (auth.uid()::text = user_id);
  END IF;
END $$;
