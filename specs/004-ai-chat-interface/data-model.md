# Data Model: AI Conversational Chat Interface

**Branch**: `004-ai-chat-interface` | **Date**: 2026-04-30

---

## Existing Entities (Unchanged)

### `chat_messages` (Supabase table — no migration needed)

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `user_id` | TEXT | Owner (uses `anon-user` fallback) |
| `role` | TEXT | `"user"` or `"assistant"` |
| `content` | TEXT | Display text of the message |
| `rich_card` | JSONB | Optional structured card payload (see below) |
| `created_at` | TIMESTAMPTZ | Message timestamp |

---

## Extended Type Definitions (TypeScript — `src/types/index.ts`)

### `TxReceiptCard` (extended)

The existing type gains `category`, `confidence`, and `status` fields:

```typescript
export interface TxReceiptCard {
  type: "tx_receipt";
  transaction_id: string | null;   // null = not yet confirmed
  merchant: string;
  amount: number;                   // negative = expense, positive = income
  category: string;                 // Arabic category label, e.g. "مطاعم"
  confidence: number;               // 0–100 integer
  suggestions: Array<{ label: string; project_id: string }>;
  status: "pending" | "confirmed" | "deleted";
}
```

### `InsightCard` (new)

Proactive AI insight messages carry this rich card for rendering the action button:

```typescript
export interface InsightCard {
  type: "insight";
  pattern: "repeated_merchant" | "budget_warning" | "anomaly";
  action_label: string;             // Arabic CTA, e.g. "نقل للمشروع"
  action_payload: Record<string, unknown>;
}
```

### `RichCard` (updated union)

```typescript
export type RichCard = TxReceiptCard | ChipsCard | InsightCard;
```

---

## State Transitions

### Receipt Card Lifecycle

```
[user sends transaction message]
         │
         ▼
  [API detects intent]
         │
         ├─ Transaction detected ──▶ [AI extracts fields]
         │                                   │
         │                                   ▼
         │                        [assistant message saved with
         │                         rich_card: TxReceiptCard{status: "pending"}]
         │                                   │
         │              ┌────────────────────┤
         │              │                    │
         │           [Confirm]           [Delete]
         │              │                    │
         │              ▼                    ▼
         │   [POST /api/transactions]   [PATCH card status → "deleted"]
         │   [PATCH card → "confirmed"] [card shows dismissed state]
         │
         └─ Q&A / no transaction ──▶ [streaming text response, no rich card]
```

### Voice Input Lifecycle

```
[mic button tap]
       │
       ▼
[SpeechRecognition.start()]
       │
       ▼
[recording animation active]
       │
       ├─ interim results ──▶ [show in input field (live)]
       │
       ├─ final result ──▶ [feed into onSend() → normal message flow]
       │
       └─ error / unsupported ──▶ [toast error, reset mic state]
```

---

## Entity Relationships

```
chat_messages
  │  rich_card (JSONB)
  │    ├── TxReceiptCard
  │    │     └── suggestions[].project_id ──▶ projects.id
  │    ├── InsightCard
  │    │     └── action_payload.project_id ──▶ projects.id (optional)
  │    └── ChipsCard (unchanged)
  │
  └── on TxReceiptCard confirm ──▶ transactions (new row created)
```

---

## Validation Rules

| Field | Rule |
|-------|------|
| `TxReceiptCard.amount` | Non-zero number; negative = expense |
| `TxReceiptCard.confidence` | Integer 0–100 |
| `TxReceiptCard.status` | One of `"pending"`, `"confirmed"`, `"deleted"` |
| `InsightCard.pattern` | One of the three defined pattern keys |
| `chat_messages` limit | Last 50 fetched; oldest beyond that are not loaded |
