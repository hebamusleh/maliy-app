-- Migration 004: Expand card_links with full bank card data
-- Run this in Supabase SQL Editor after migration 003

ALTER TABLE card_links
  ADD COLUMN IF NOT EXISTS cardholder_name TEXT,
  ADD COLUMN IF NOT EXISTS expiry_month    SMALLINT CHECK (expiry_month BETWEEN 1 AND 12),
  ADD COLUMN IF NOT EXISTS expiry_year     SMALLINT CHECK (expiry_year >= 2020),
  ADD COLUMN IF NOT EXISTS bank_name       TEXT,
  ADD COLUMN IF NOT EXISTS card_network    TEXT CHECK (card_network IN ('Visa','Mastercard','Mada','Amex','Other')),
  ADD COLUMN IF NOT EXISTS card_type       TEXT NOT NULL DEFAULT 'credit' CHECK (card_type IN ('credit','debit'));

COMMENT ON COLUMN card_links.cardholder_name IS 'Full name on the card';
COMMENT ON COLUMN card_links.expiry_month    IS 'Card expiry month (1–12)';
COMMENT ON COLUMN card_links.expiry_year     IS 'Card expiry year (e.g. 2028)';
COMMENT ON COLUMN card_links.bank_name       IS 'Issuing bank name (e.g. Al Rajhi, SNB)';
COMMENT ON COLUMN card_links.card_network    IS 'Card network: Visa, Mastercard, Mada, Amex, Other';
COMMENT ON COLUMN card_links.card_type       IS 'credit or debit';
