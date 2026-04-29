# Data Model: ماليّ Full UI Implementation

**Feature**: 002-maliy-ui-implementation
**Date**: 2026-04-29

---

## Entity Relationship Overview

```
users (Supabase Auth)
  │
  ├── projects (existing)
  │     └── card_links (existing)
  │
  ├── transactions ──── projects
  │         │ ─────── spending_categories
  │         └──────── classification_rules (merchant pattern)
  │
  ├── classification_rules ── projects
  ├── spending_categories (global, no user_id)
  ├── debts
  ├── alerts
  ├── chat_messages
  └── forecast_snapshots
```

---

## Tables

### `projects` (existing — no changes)

```sql
-- Already exists from 001-project-system
CREATE TABLE projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  icon        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('personal', 'business', 'freelance')),
  budget_limit DECIMAL(12,2),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- RLS: auth.uid() = user_id (existing)
```

### `card_links` (existing — no changes)

```sql
-- Already exists from 001-project-system
CREATE TABLE card_links (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id  UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  last4       TEXT NOT NULL CHECK (last4 ~ '^[0-9]{4}$'),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE card_links ENABLE ROW LEVEL SECURITY;
```

### `spending_categories` (new — global lookup table)

```sql
CREATE TABLE spending_categories (
  id       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_ar  TEXT NOT NULL UNIQUE,        -- e.g. 'مطاعم وطعام'
  name_en  TEXT NOT NULL UNIQUE,        -- e.g. 'Restaurants'
  icon     TEXT NOT NULL,               -- emoji or icon key
  color    TEXT NOT NULL DEFAULT '#C8853A'
);
-- No RLS — read-only global table
-- Seed data (see migration below)
```

**Seed data**:
```sql
INSERT INTO spending_categories (name_ar, name_en, icon, color) VALUES
  ('مطاعم وطعام',     'Restaurants',    '🍽️', '#C8853A'),
  ('تسوق',            'Shopping',       '🛒', '#B85C5C'),
  ('مواصلات ووقود',  'Transportation', '⛽', '#0E1B2C'),
  ('اشتراكات',        'Subscriptions',  '📱', '#6B8E6B'),
  ('فواتير',          'Utilities',      '💡', '#9c7ab8'),
  ('ترفيه',           'Entertainment',  '🎬', '#5b8bc9'),
  ('صحة',             'Health',         '🏥', '#e07b7b'),
  ('تعليم',           'Education',      '📚', '#7bae7b'),
  ('أخرى',            'Other',          '🎯', '#c9a97a');
```

### `transactions` (extend existing)

```sql
-- Migration: add columns to existing transactions table
ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS status             TEXT NOT NULL DEFAULT 'pending'
                                             CHECK (status IN ('classified', 'pending', 'skipped')),
  ADD COLUMN IF NOT EXISTS confidence_score   FLOAT CHECK (confidence_score BETWEEN 0 AND 1),
  ADD COLUMN IF NOT EXISTS ai_reasoning       TEXT,
  ADD COLUMN IF NOT EXISTS payment_last4      TEXT CHECK (payment_last4 ~ '^[0-9]{4}$' OR payment_last4 IS NULL),
  ADD COLUMN IF NOT EXISTS transaction_time   TIME,
  ADD COLUMN IF NOT EXISTS category_id        UUID REFERENCES spending_categories(id),
  ADD COLUMN IF NOT EXISTS notes              TEXT,
  ADD COLUMN IF NOT EXISTS classified_at      TIMESTAMPTZ;

-- Index for fast pending queue queries
CREATE INDEX IF NOT EXISTS idx_transactions_pending
  ON transactions(user_id, status)
  WHERE status = 'pending';

-- Index for analytics date range queries
CREATE INDEX IF NOT EXISTS idx_transactions_date
  ON transactions(user_id, date DESC);

-- Index for merchant-level pattern lookups
CREATE INDEX IF NOT EXISTS idx_transactions_merchant
  ON transactions(user_id, LOWER(merchant));
```

**Full column set after migration**:

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| user_id | UUID FK → auth.users | RLS |
| project_id | UUID FK → projects | nullable when pending |
| amount | DECIMAL(12,2) | positive=income, negative=expense |
| currency | TEXT DEFAULT 'SAR' | |
| merchant | TEXT | merchant name |
| date | DATE | transaction date |
| status | TEXT | classified / pending / skipped |
| confidence_score | FLOAT | 0–1, null if no AI used |
| ai_reasoning | TEXT | Arabic explanation from AI |
| payment_last4 | TEXT | last 4 digits of payment card |
| transaction_time | TIME | time of day |
| category_id | UUID FK → spending_categories | |
| notes | TEXT | user notes |
| classified_at | TIMESTAMPTZ | when user/AI confirmed |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

**RLS Policies**:
```sql
CREATE POLICY "Users own their transactions"
  ON transactions FOR ALL USING (auth.uid() = user_id);
```

**State transitions**:
```
[imported/created] → status = 'pending'
    │
    ├─ AI confidence ≥ 0.9 → status = 'classified' (auto, silent)
    ├─ user confirms classification → status = 'classified'
    └─ user skips → status = 'skipped'
```

---

### `classification_rules` (new)

Stores learned merchant → project mappings. Layer 1 of the classification pipeline.

```sql
CREATE TABLE classification_rules (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  merchant_pattern TEXT NOT NULL,           -- LOWER(merchant), exact match in v1
  project_id       UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  category_id      UUID REFERENCES spending_categories(id),
  confirmation_count INT NOT NULL DEFAULT 1,  -- how many times user confirmed
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, merchant_pattern)
);

ALTER TABLE classification_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their rules"
  ON classification_rules FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_rules_merchant ON classification_rules(user_id, merchant_pattern);
```

**Upsert logic** (on user classification confirm):
```sql
INSERT INTO classification_rules (user_id, merchant_pattern, project_id, category_id)
VALUES ($1, LOWER($2), $3, $4)
ON CONFLICT (user_id, merchant_pattern)
DO UPDATE SET
  project_id = EXCLUDED.project_id,
  category_id = EXCLUDED.category_id,
  confirmation_count = classification_rules.confirmation_count + 1,
  updated_at = NOW();
```

---

### `debts` (new)

```sql
CREATE TABLE debts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  debtor_name     TEXT NOT NULL,              -- creditor or debtor name
  direction       TEXT NOT NULL CHECK (direction IN ('owed_by_me', 'owed_to_me')),
  total_amount    DECIMAL(12,2) NOT NULL CHECK (total_amount > 0),
  remaining_amount DECIMAL(12,2) NOT NULL CHECK (remaining_amount >= 0),
  due_date        DATE,                        -- null = flexible
  notes           TEXT,
  is_urgent       BOOLEAN NOT NULL DEFAULT FALSE,
  is_interest_free BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their debts"
  ON debts FOR ALL USING (auth.uid() = user_id);

-- Auto-set urgency: trigger or app logic flags is_urgent when due_date within 7 days
```

---

### `alerts` (new)

```sql
CREATE TABLE alerts (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type           TEXT NOT NULL CHECK (type IN ('urgent', 'recommendation', 'reminder', 'achievement')),
  title          TEXT NOT NULL,
  body           TEXT NOT NULL,
  action_type    TEXT,          -- 'navigate', 'confirm', 'dismiss-only', null
  action_payload JSONB,         -- e.g. { "route": "/review" } or { "debtId": "..." }
  dismissed      BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their alerts"
  ON alerts FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_alerts_active ON alerts(user_id, dismissed, created_at DESC)
  WHERE dismissed = FALSE;
```

---

### `chat_messages` (new)

```sql
CREATE TABLE chat_messages (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role       TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT NOT NULL,
  rich_card  JSONB,                   -- optional structured card for rendering
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their messages"
  ON chat_messages FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_chat_recent ON chat_messages(user_id, created_at DESC);
```

**`rich_card` JSONB schema** (discriminated union):
```jsonc
// Transaction receipt card
{ "type": "tx_receipt",
  "transaction_id": "...",
  "merchant": "...",
  "amount": -87.00,
  "suggestions": [
    { "label": "شخصي", "project_id": "..." },
    { "label": "عمل", "project_id": "..." }
  ]
}

// Action chip set
{ "type": "chips",
  "chips": [
    { "label": "شاهد الخطة", "action": "navigate", "payload": "/forecast" },
    { "label": "لا، شكرًا", "action": "dismiss" }
  ]
}
```

---

### `forecast_snapshots` (new — cache table)

```sql
CREATE TABLE forecast_snapshots (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  horizon_days   INT NOT NULL CHECK (horizon_days IN (7, 30, 90)),
  pessimistic    DECIMAL(12,2) NOT NULL,
  likely         DECIMAL(12,2) NOT NULL,
  optimistic     DECIMAL(12,2) NOT NULL,
  daily_balances JSONB NOT NULL,             -- array of {date, balance} objects
  danger_zones   JSONB,                      -- array of {start_date, end_date, min_balance}
  upcoming_events JSONB,                     -- array of {type, label, amount, date}
  generated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, horizon_days)
);

ALTER TABLE forecast_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users own their forecasts"
  ON forecast_snapshots FOR ALL USING (auth.uid() = user_id);
```

**TTL**: Application logic invalidates/regenerates when `generated_at < NOW() - INTERVAL '6 hours'` or when a new transaction is classified.

---

## SQL Views

### `transaction_graph` (Knowledge Graph — Constitution IV)

```sql
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
LEFT JOIN projects p   ON t.project_id = p.id
LEFT JOIN spending_categories sc ON t.category_id = sc.id
LEFT JOIN classification_rules cr
  ON LOWER(t.merchant) = cr.merchant_pattern AND cr.user_id = t.user_id;
```

### `monthly_summary` (Analytics API backing view)

```sql
CREATE OR REPLACE VIEW monthly_summary AS
SELECT
  user_id,
  DATE_TRUNC('month', date) AS month,
  project_id,
  SUM(CASE WHEN amount > 0 THEN amount ELSE 0 END) AS income,
  SUM(CASE WHEN amount < 0 THEN ABS(amount) ELSE 0 END) AS expenses,
  COUNT(*) AS transaction_count
FROM transactions
WHERE status = 'classified'
GROUP BY user_id, month, project_id;
```

---

## TypeScript Types

Extended `src/types/project.ts` and new `src/types/index.ts`:

```typescript
// Extended Transaction
export interface Transaction {
  id: string;
  user_id: string;
  project_id: string | null;
  amount: number;                          // positive=income, negative=expense
  currency: string;
  merchant: string | null;
  date: string;                            // ISO date
  status: 'classified' | 'pending' | 'skipped';
  confidence_score: number | null;
  ai_reasoning: string | null;
  payment_last4: string | null;
  transaction_time: string | null;
  category_id: string | null;
  notes: string | null;
  classified_at: string | null;
  created_at: string;
  updated_at: string;
  // Relations (when joined)
  project?: Project;
  category?: SpendingCategory;
}

export interface SpendingCategory {
  id: string;
  name_ar: string;
  name_en: string;
  icon: string;
  color: string;
}

export interface ClassificationRule {
  id: string;
  user_id: string;
  merchant_pattern: string;
  project_id: string;
  category_id: string | null;
  confirmation_count: number;
  created_at: string;
  updated_at: string;
}

export interface Debt {
  id: string;
  user_id: string;
  debtor_name: string;
  direction: 'owed_by_me' | 'owed_to_me';
  total_amount: number;
  remaining_amount: number;
  due_date: string | null;
  notes: string | null;
  is_urgent: boolean;
  is_interest_free: boolean;
  created_at: string;
  updated_at: string;
}

export type AlertType = 'urgent' | 'recommendation' | 'reminder' | 'achievement';

export interface Alert {
  id: string;
  user_id: string;
  type: AlertType;
  title: string;
  body: string;
  action_type: 'navigate' | 'confirm' | 'dismiss-only' | null;
  action_payload: Record<string, unknown> | null;
  dismissed: boolean;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  user_id: string;
  role: 'user' | 'assistant';
  content: string;
  rich_card: TxReceiptCard | ChipsCard | null;
  created_at: string;
}

export interface TxReceiptCard {
  type: 'tx_receipt';
  transaction_id: string;
  merchant: string;
  amount: number;
  suggestions: Array<{ label: string; project_id: string }>;
}

export interface ChipsCard {
  type: 'chips';
  chips: Array<{ label: string; action: string; payload?: unknown }>;
}

export interface ForecastSnapshot {
  id: string;
  user_id: string;
  horizon_days: 7 | 30 | 90;
  pessimistic: number;
  likely: number;
  optimistic: number;
  daily_balances: Array<{ date: string; balance: number }>;
  danger_zones: Array<{ start_date: string; end_date: string; min_balance: number }> | null;
  upcoming_events: Array<{ type: string; label: string; amount: number; date: string }> | null;
  generated_at: string;
}

export interface DashboardData {
  balance: number;
  income: number;
  expenses: number;
  savings: number;
  balance_change_pct: number;
  pending_count: number;
  projects: ProjectSummary[];
  recent_alerts: Alert[];
}

export interface ProjectSummary {
  project: Project;
  spend: number;
  budget_used_pct: number;
  remaining: number;
  transaction_count: number;
}

export interface AnalyticsData {
  income: number;
  expenses: number;
  daily_average: number;
  savings_rate: number;
  income_change_pct: number;
  expenses_change_pct: number;
  categories: CategorySpend[];
  project_distribution: ProjectDistribution[];
  daily_spend: DailySpend[];
}

export interface CategorySpend {
  category: SpendingCategory;
  amount: number;
  pct: number;
}

export interface ProjectDistribution {
  project: Project;
  amount: number;
  pct: number;
}

export interface DailySpend {
  date: string;
  amount: number;
}
```

---

## Validation Rules

| Entity | Field | Rule |
|---|---|---|
| Transaction | amount | Non-zero DECIMAL; positive = income |
| Transaction | status | Must be 'classified', 'pending', or 'skipped' |
| Transaction | payment_last4 | Exactly 4 digits if provided |
| Transaction | confidence_score | 0.0 – 1.0 inclusive |
| Debt | total_amount | Must be > 0 |
| Debt | remaining_amount | Must be 0 ≤ remaining ≤ total |
| Debt | direction | 'owed_by_me' or 'owed_to_me' |
| ClassificationRule | merchant_pattern | Stored LOWER-cased, max 255 chars |
| Alert | type | Must be one of the 4 types |
| ForecastSnapshot | horizon_days | Must be 7, 30, or 90 |
| ChatMessage | role | 'user' or 'assistant' |
