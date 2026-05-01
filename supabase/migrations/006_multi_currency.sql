-- ============================================================
-- Migration 006: Multi-Currency Support
-- Base currency: SAR (Saudi Riyal)
-- All analytics use amount_base; original values are preserved.
-- ============================================================

-- ─── 1. Extend transactions ───────────────────────────────
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS currency_original TEXT    NOT NULL DEFAULT 'SAR',
  ADD COLUMN IF NOT EXISTS exchange_rate     DECIMAL(12,6) NOT NULL DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS amount_base       DECIMAL(12,2);

-- Back-fill: existing rows are all SAR → rate 1:1
UPDATE transactions
   SET amount_base = amount
 WHERE amount_base IS NULL;

ALTER TABLE transactions
  ALTER COLUMN amount_base SET NOT NULL,
  ALTER COLUMN amount_base SET DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_transactions_currency
  ON transactions(currency_original) WHERE currency_original <> 'SAR';

-- ─── 2. Exchange rates cache ──────────────────────────────
-- Stores SAR-per-1-unit-of-currency rates, locked to a date.
CREATE TABLE IF NOT EXISTS exchange_rates (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  currency   TEXT  NOT NULL,          -- e.g. 'USD', 'EUR'
  rate       DECIMAL(12,6) NOT NULL,  -- how many SAR per 1 unit of this currency
  date       DATE  NOT NULL,
  source     TEXT  DEFAULT 'hardcoded',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (currency, date)
);

ALTER TABLE exchange_rates DISABLE ROW LEVEL SECURITY;

-- Seed with approximate SAR exchange rates (2026)
INSERT INTO exchange_rates (currency, rate, date, source) VALUES
  ('USD', 3.750000, CURRENT_DATE, 'seed'),
  ('EUR', 4.100000, CURRENT_DATE, 'seed'),
  ('GBP', 4.750000, CURRENT_DATE, 'seed'),
  ('AED', 1.020000, CURRENT_DATE, 'seed'),
  ('KWD', 12.20000, CURRENT_DATE, 'seed'),
  ('BHD', 9.950000, CURRENT_DATE, 'seed'),
  ('QAR', 1.030000, CURRENT_DATE, 'seed'),
  ('OMR', 9.740000, CURRENT_DATE, 'seed'),
  ('JOD', 5.290000, CURRENT_DATE, 'seed'),
  ('EGP', 0.075000, CURRENT_DATE, 'seed'),
  ('JPY', 0.025000, CURRENT_DATE, 'seed'),
  ('CNY', 0.520000, CURRENT_DATE, 'seed'),
  ('INR', 0.045000, CURRENT_DATE, 'seed'),
  ('TRY', 0.110000, CURRENT_DATE, 'seed'),
  ('SAR', 1.000000, CURRENT_DATE, 'seed')
ON CONFLICT (currency, date) DO NOTHING;
