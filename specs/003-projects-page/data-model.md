# Data Model: Unified Projects Page

**Feature**: 003-projects-page
**Date**: 2026-04-30

---

## Entities

### Project

Represents a named financial context that groups transactions together.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `string` (UUID) | PK, auto-generated | |
| `user_id` | `string` | FK → user, indexed | Uses `'anon-user'` fallback when no auth |
| `name` | `string` | Required, non-empty | Display name |
| `icon` | `string` | Required | Single emoji character from predefined set |
| `type` | `'personal' \| 'business' \| 'freelance'` | Required | Project category |
| `budget_limit` | `number \| null` | Optional, positive | Soft limit for display/warnings only |
| `created_at` | `string` (ISO 8601) | Auto | |
| `updated_at` | `string` (ISO 8601) | Auto | |

**Validation Rules**:
- `name`: min 1 character
- `budget_limit`: must be positive if provided
- `type`: must be one of the three allowed values

**State Transitions**:
- Created → Active → Deleted (soft delete not needed; hard delete with transaction unlinking)

---

### CardLink

Associates a bank card identifier (last 4 digits) with a project.

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `string` (UUID) | PK, auto-generated | |
| `user_id` | `string` | FK → user | |
| `project_id` | `string` (UUID) | FK → Project | |
| `last4` | `string` | Required, exactly 4 digits | `/^\d{4}$/` |
| `created_at` | `string` (ISO 8601) | Auto | |

**Uniqueness**: `(user_id, project_id, last4)` must be unique — one card cannot be linked to the same project twice, but can be linked to different projects.

**Change from current implementation**: Removed the cross-project uniqueness constraint. Previously, a card could only be linked to one project. Now a card can be linked to multiple projects.

---

### Transaction

A financial event. Always belongs to exactly one project (enforced at the form level).

| Field | Type | Constraints | Notes |
|-------|------|-------------|-------|
| `id` | `string` (UUID) | PK | |
| `user_id` | `string` | FK → user | |
| `project_id` | `string \| null` | FK → Project | `null` only for orphaned transactions (project was deleted) |
| `amount` | `number` | Non-zero | Positive = income, negative = expense |
| `currency` | `string` | e.g., `'AED'` | Default: `'AED'` |
| `merchant` | `string \| null` | | Human-readable source/payee |
| `date` | `string` (ISO 8601 date) | Required | |
| `status` | `'classified' \| 'pending' \| 'skipped'` | | Classification state |
| `payment_last4` | `string \| null` | 4 digits | Used for auto-classification via CardLink |
| `category_id` | `string \| null` | FK → SpendingCategory | |
| `notes` | `string \| null` | | |
| `confidence_score` | `number \| null` | 0–1 | AI classification confidence |
| `ai_reasoning` | `string \| null` | | |
| `classified_at` | `string \| null` | | |
| `transaction_time` | `string \| null` | | |
| `created_at` | `string` (ISO 8601) | Auto | |
| `updated_at` | `string` (ISO 8601) | Auto | |

**Constraint Change**: `project_id` becomes required in `CreateTransactionForm` (form-level enforcement). The database column remains nullable to support orphaned transactions when a project is deleted.

---

### ProjectStats (derived, not persisted)

Computed from a project's transactions. Returned by `/api/projects/[id]/dashboard`.

| Field | Type | Notes |
|-------|------|-------|
| `total_income` | `number` | Sum of positive amounts |
| `total_expenses` | `number` | Sum of absolute values of negative amounts |
| `net_profit` | `number` | `total_income - total_expenses` |
| `transaction_count` | `number` | |
| `budget_used_percentage` | `number \| null` | `(total_expenses / budget_limit) * 100` |

---

### ProjectDashboard (API response, not persisted)

| Field | Type | Notes |
|-------|------|-------|
| `project` | `Project` | Full project record |
| `stats` | `ProjectStats` | Computed stats |
| `recent_transactions` | `Transaction[]` | Last 10 transactions |
| `insights` | `string[]` | AI-generated text insights |

---

## Relationships

```
User (anon-user or Supabase user)
  └── has many Projects
        ├── has many CardLinks (many-to-one with last4)
        └── has many Transactions
              └── has one (or zero) Category
```

---

## Delete Behavior

When a Project is deleted:
1. All `CardLink` records for the project are hard-deleted (cascade).
2. All `Transaction` records with `project_id = <deleted_id>` have `project_id` set to `null` (orphaned — not deleted).
3. The project record itself is hard-deleted.

---

## Seed Data (for no-auth development)

Three seed projects for `user_id = 'anon-user'`:

| Name | Icon | Type | Budget |
|------|------|------|--------|
| الشخصي | 🏠 | personal | 3000 |
| عمل | 💼 | business | 10000 |
| فريلانس | 💻 | freelance | 5000 |

With 5–8 transactions per project covering income and expense amounts, spread across the last 3 months.
