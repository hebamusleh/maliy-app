-- ============================================================
-- Migration 008: Knowledge Graph
-- Run after migration 007_user_settings.sql
-- ============================================================

-- ─── 1. kg_merchants ───────────────────────────────────────
-- Merchant nodes: normalized names + aliases
CREATE TABLE IF NOT EXISTS kg_merchants (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  normalized_name TEXT NOT NULL UNIQUE,
  aliases         TEXT[] NOT NULL DEFAULT '{}',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_kg_merchants_normalized
  ON kg_merchants(normalized_name);

-- ─── 2. kg_merchant_category (edge: Merchant → Category) ──
-- Learned affinity between a merchant and a spending category,
-- scoped per user. weight increments on every confirmed tx.
CREATE TABLE IF NOT EXISTS kg_merchant_category (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  merchant_id UUID NOT NULL REFERENCES kg_merchants(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES spending_categories(id) ON DELETE CASCADE,
  weight      FLOAT NOT NULL DEFAULT 1.0,
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, merchant_id, category_id)
);

CREATE INDEX IF NOT EXISTS idx_kg_mc_lookup
  ON kg_merchant_category(user_id, merchant_id, weight DESC);

-- ─── 3. kg_time_patterns (edge: Merchant → TimePattern) ───
-- Recurring timing for a merchant (e.g. Netflix always on day 15)
CREATE TABLE IF NOT EXISTS kg_time_patterns (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL,
  merchant_id  UUID NOT NULL REFERENCES kg_merchants(id) ON DELETE CASCADE,
  day_of_week  INT CHECK (day_of_week BETWEEN 0 AND 6),   -- 0=Sunday
  hour_start   INT CHECK (hour_start BETWEEN 0 AND 23),
  hour_end     INT CHECK (hour_end BETWEEN 0 AND 23),
  month_day    INT CHECK (month_day BETWEEN 1 AND 31),     -- day of month
  occurrence_count INT NOT NULL DEFAULT 1,
  last_seen    DATE NOT NULL DEFAULT CURRENT_DATE,
  UNIQUE (user_id, merchant_id, month_day)
);

CREATE INDEX IF NOT EXISTS idx_kg_tp_lookup
  ON kg_time_patterns(user_id, merchant_id);

-- ─── 4. kg_behavioral_patterns ─────────────────────────────
-- Detected behavioral patterns per user
CREATE TABLE IF NOT EXISTS kg_behavioral_patterns (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('stress_spending','recurring','impulse')),
  trigger      TEXT,
  metadata     JSONB NOT NULL DEFAULT '{}',
  detected_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, type, trigger)
);

CREATE INDEX IF NOT EXISTS idx_kg_bp_user
  ON kg_behavioral_patterns(user_id, type);

-- ─── 5. kg_transaction_merchant (edge: Transaction → Merchant) ─
-- Links a transaction to its resolved merchant node
CREATE TABLE IF NOT EXISTS kg_transaction_merchant (
  transaction_id UUID NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  merchant_id    UUID NOT NULL REFERENCES kg_merchants(id) ON DELETE CASCADE,
  PRIMARY KEY (transaction_id, merchant_id)
);

CREATE INDEX IF NOT EXISTS idx_kg_txm_merchant
  ON kg_transaction_merchant(merchant_id);
