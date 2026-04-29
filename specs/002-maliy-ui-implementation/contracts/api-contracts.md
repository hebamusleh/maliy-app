# API Contracts: ماليّ Full UI Implementation

**Feature**: 002-maliy-ui-implementation
**Date**: 2026-04-29
**Base path**: `/api/`
**Auth**: All endpoints require Supabase session cookie (JWT). Return `401` if missing.
**Format**: JSON. Arabic error messages in `error` field for UI display.

---

## Dashboard

### `GET /api/dashboard`

Returns aggregated dashboard data for the current month.

**Query params**: `month` (optional, ISO date, defaults to current month)

**Response `200`**:
```json
{
  "balance": 12847.00,
  "income": 24500.00,
  "expenses": 11653.00,
  "savings": 3200.00,
  "balance_change_pct": 8.4,
  "pending_count": 4,
  "projects": [
    {
      "project": { "id": "...", "name": "شخصي", "type": "personal", "icon": "◐", "budget_limit": 8500.00 },
      "spend": 5820.00,
      "budget_used_pct": 68.5,
      "remaining": 2680.00,
      "transaction_count": 42
    }
  ],
  "recent_alerts": [
    {
      "id": "...",
      "type": "danger",
      "title": "خطر ماليّ متوقع خلال 12 يوم",
      "body": "...",
      "created_at": "..."
    }
  ]
}
```

---

## Transactions

### `GET /api/transactions`

List transactions with filtering and pagination.

**Query params**:
- `project_id` — filter by project UUID
- `status` — `classified | pending | skipped | all` (default `all`)
- `search` — merchant name search (case-insensitive)
- `from` — ISO date start
- `to` — ISO date end
- `page` — integer (default 1)
- `limit` — integer (default 50, max 200)

**Response `200`**:
```json
{
  "transactions": [ ...Transaction[] ],
  "total": 134,
  "page": 1,
  "limit": 50
}
```

---

### `POST /api/transactions`

Create a new transaction manually.

**Request body**:
```json
{
  "merchant": "كافيه أوريغانو",
  "amount": -87.00,
  "date": "2026-04-27",
  "transaction_time": "09:15:00",
  "payment_last4": "4521",
  "notes": "مع فريق التصميم"
}
```

**Response `201`**: `{ "transaction": Transaction }`

---

### `PATCH /api/transactions/:id`

Update transaction fields (notes, project override).

**Request body** (partial):
```json
{
  "notes": "updated note",
  "project_id": "...",
  "category_id": "..."
}
```

**Response `200`**: `{ "transaction": Transaction }`

---

### `DELETE /api/transactions/:id`

Soft-delete a transaction (sets status to 'skipped').

**Response `204`**: No body.

---

### `POST /api/transactions/:id/classify`

Classify a single pending transaction. Triggers learning pipeline.

**Request body**:
```json
{
  "project_id": "...",
  "category_id": "...",
  "apply_to_merchant": false
}
```

- `apply_to_merchant: true` → classifies ALL pending transactions from same merchant

**Response `200`**:
```json
{
  "transaction": Transaction,
  "applied_count": 1,
  "rule_created": false
}
```

---

### `POST /api/transactions/classify-bulk`

Smart-classify all pending transactions using current model.

**Request body**: `{}`

**Response `200`**:
```json
{
  "classified_count": 3,
  "still_pending_count": 1,
  "results": [
    { "transaction_id": "...", "project_id": "...", "confidence": 0.95 }
  ]
}
```

---

### `GET /api/transactions/export`

Download transactions as CSV.

**Query params**: same as `GET /api/transactions` (except page/limit)

**Response `200`**: `Content-Type: text/csv`, file download.

---

## Analytics

### `GET /api/analytics`

Returns analytics aggregates for a period.

**Query params**:
- `from` — ISO date (default: start of current month)
- `to` — ISO date (default: today)

**Response `200`**:
```json
{
  "income": 24500.00,
  "expenses": 11653.00,
  "daily_average": 432.00,
  "savings_rate": 0.52,
  "income_change_pct": 12.0,
  "expenses_change_pct": 4.2,
  "categories": [
    { "category": SpendingCategory, "amount": 3240.00, "pct": 0.278 }
  ],
  "project_distribution": [
    { "project": Project, "amount": 5820.00, "pct": 0.50 }
  ],
  "daily_spend": [
    { "date": "2026-04-01", "amount": 345.00 }
  ]
}
```

---

## Forecast

### `GET /api/forecast`

Returns forecast scenarios. Returns cached snapshot if < 6 hours old.

**Query params**: `horizon` — `7 | 30 | 90` (default `30`)

**Response `200`**:
```json
{
  "horizon_days": 30,
  "pessimistic": 2140.00,
  "likely": 8420.00,
  "optimistic": 11890.00,
  "daily_balances": [
    { "date": "2026-04-28", "balance": 12847.00 }
  ],
  "danger_zones": [
    { "start_date": "2026-05-09", "end_date": "2026-05-11", "min_balance": 950.00 }
  ],
  "upcoming_events": [
    { "type": "income", "label": "راتب شهر مايو", "amount": 18500.00, "date": "2026-05-01" },
    { "type": "expense", "label": "إيجار", "amount": -4200.00, "date": "2026-05-03" }
  ],
  "generated_at": "2026-04-29T09:00:00Z"
}
```

---

## Debts

### `GET /api/debts`

**Response `200`**:
```json
{
  "owed_by_me": [ ...Debt[] ],
  "owed_to_me": [ ...Debt[] ],
  "summary": {
    "total_owed_by_me": 8750.00,
    "total_owed_to_me": 2400.00,
    "net": -6350.00,
    "monthly_repayment_rate": 1250.00
  }
}
```

---

### `POST /api/debts`

Create a new debt record.

**Request body**:
```json
{
  "debtor_name": "قرض السيارة",
  "direction": "owed_by_me",
  "total_amount": 12000.00,
  "remaining_amount": 4500.00,
  "due_date": "2026-05-01",
  "notes": "بنك الراجحي · قسط شهري",
  "is_interest_free": false
}
```

**Response `201`**: `{ "debt": Debt }`

---

### `PATCH /api/debts/:id`

Update debt record.

**Request body** (partial): any Debt fields.

**Response `200`**: `{ "debt": Debt }`

---

### `DELETE /api/debts/:id`

Delete a debt record.

**Response `204`**: No body.

---

### `POST /api/debts/:id/payment`

Record a payment reducing the debt's remaining balance.

**Request body**:
```json
{ "amount": 750.00, "date": "2026-04-29", "notes": "القسط الشهري" }
```

**Response `200`**:
```json
{
  "debt": Debt,
  "transaction": Transaction
}
```

---

## Alerts

### `GET /api/alerts`

**Query params**: `type` — filter by alert type; `dismissed` — `true | false | all` (default `false`)

**Response `200`**:
```json
{
  "alerts": [ ...Alert[] ],
  "counts": { "all": 12, "urgent": 2, "recommendation": 5, "reminder": 3, "achievement": 2 }
}
```

---

### `POST /api/alerts/:id/dismiss`

Dismiss an alert.

**Response `200`**: `{ "alert": Alert }`

---

## Chat

### `GET /api/chat/messages`

Fetch last N chat messages.

**Query params**: `limit` (default 50)

**Response `200`**: `{ "messages": ChatMessage[] }`

---

### `POST /api/chat`

Send a message to the AI assistant. Returns streaming response.

**Request body**:
```json
{ "message": "كيف حال ميزانيتي هذا الشهر؟" }
```

**Response `200`**: `Content-Type: text/event-stream`

Each SSE event:
```
data: {"type":"text","content":"رصيدك هذا الشهر..."}
data: {"type":"rich_card","card":{...}}
data: {"type":"done"}
```

---

## Classification Rules

### `GET /api/classification/rules`

List user's learned classification rules.

**Response `200`**: `{ "rules": ClassificationRule[] }`

---

### `DELETE /api/classification/rules/:id`

Delete a classification rule.

**Response `204`**: No body.

---

## Error Response Format

All errors follow this structure:
```json
{
  "error": "رسالة خطأ للمستخدم (Arabic)",
  "code": "MACHINE_READABLE_CODE",
  "details": {}
}
```

Common HTTP status codes:
- `400` Bad Request — validation failure
- `401` Unauthorized — no/invalid session
- `403` Forbidden — attempting to access another user's data
- `404` Not Found
- `409` Conflict — duplicate rule, etc.
- `500` Internal Server Error
