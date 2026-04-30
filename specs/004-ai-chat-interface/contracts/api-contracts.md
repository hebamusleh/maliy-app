# API Contracts: AI Conversational Chat Interface

**Branch**: `004-ai-chat-interface` | **Date**: 2026-04-30

---

## Existing Endpoints (Behaviour Unchanged)

### `POST /api/chat`

Sends a user message and receives a streaming SSE response.

**Behaviour change**: Before streaming, the API now detects whether the message is a transaction intent. If yes, it runs a structured extraction pass and attaches a `TxReceiptCard` to the saved assistant message (streamed text still shows confirmation prose). Non-transaction messages behave exactly as before.

**Request**
```json
{ "message": "دفعت 120 ريال مطعم البيك" }
```

**SSE stream chunks** (unchanged format)
```
data: {"type":"text","content":"تم تسجيل"}
data: {"type":"text","content":" العملية..."}
data: [DONE]
```

**Saved assistant message** (in DB, now with optional rich_card)
```json
{
  "role": "assistant",
  "content": "تم تسجيل مبلغ 120 ريال. هل تريد تأكيد العملية؟",
  "rich_card": {
    "type": "tx_receipt",
    "transaction_id": null,
    "merchant": "مطعم البيك",
    "amount": -120,
    "category": "مطاعم",
    "confidence": 87,
    "suggestions": [
      { "label": "شخصي 🏠", "project_id": "uuid-1" },
      { "label": "عمل 💼", "project_id": "uuid-2" }
    ],
    "status": "pending"
  }
}
```

---

### `GET /api/chat/messages`

Returns the last 50 messages for the authenticated user. Unchanged.

**Response**
```json
{
  "messages": [
    {
      "id": "uuid",
      "role": "user" | "assistant",
      "content": "...",
      "rich_card": null | { ... },
      "created_at": "2026-04-30T10:00:00Z"
    }
  ]
}
```

---

## New Endpoints

### `PATCH /api/chat/messages/[id]/card`

Updates the `status` field of the `rich_card` on an existing assistant message. Used when the user confirms or deletes a receipt card.

**Request**
```json
{ "status": "confirmed" | "deleted" }
```

**On `"confirmed"`**: Also creates a transaction via `POST /api/transactions` using the receipt card values. Returns the created transaction in the response.

**On `"deleted"`**: Patches the `rich_card.status` to `"deleted"` only.

**Response (confirmed)**
```json
{
  "message": { "id": "uuid", "rich_card": { "status": "confirmed", "transaction_id": "tx-uuid", ... } },
  "transaction": { "id": "tx-uuid", "merchant": "مطعم البيك", "amount": -120, ... }
}
```

**Response (deleted)**
```json
{
  "message": { "id": "uuid", "rich_card": { "status": "deleted", ... } }
}
```

**Error responses**
- `404` — message not found or doesn't belong to user
- `400` — invalid status value or message has no `tx_receipt` rich card
- `409` — card already confirmed or deleted

---

### `GET /api/chat/insights`

Checks recent transaction data for spending patterns and inserts AI insight messages if a new pattern is detected (not already sent in the last 24 hours).

**Request**: No body. Uses `anon-user` fallback for auth.

**Response**
```json
{
  "insights_sent": 0 | 1 | 2,
  "patterns": ["repeated_merchant", "budget_warning"]
}
```

**When called**: ChatPanel calls this once on mount (after the initial messages query). If `insights_sent > 0`, the messages query is invalidated so the new insight messages appear.

**Pattern detection logic**:
| Pattern | Condition | Insight text example |
|---------|-----------|---------------------|
| `repeated_merchant` | Same merchant ≥ 3 times in 7 days | "دفعتَ في ستاربكس 3 مرات هذا الأسبوع — المجموع 156 ريال. هل تنقلها لمشروع العمل؟" |
| `budget_warning` | Any project spend ≥ 85% of budget | "مشروع العمل استهلك 87% من ميزانيته لهذا الشهر. راجع المصاريع قبل نهاية الشهر." |
| `anomaly` | Single expense > 3× daily average | "مبلغ 1,200 ريال في إيكيا أمس يعادل 4 أضعاف متوسطك اليومي — هل هو صحيح؟" |

**Deduplication**: Before inserting, the API checks whether an assistant message with the same `pattern` in `rich_card` was inserted in the last 24 hours. If yes, skips insertion.

---

## Component Contracts

### `ChatComposer` props (updated)

```typescript
interface ChatComposerProps {
  onSend: (msg: string) => void;
  isLoading: boolean;
}
```

Internal state added:
- `isRecording: boolean` — whether Web Speech API is active
- `interimTranscript: string` — live transcript shown in input

### `RichCardRenderer` props (updated — now stateful)

```typescript
interface RichCardRendererProps {
  card: RichCard;
  messageId: string;                        // needed for PATCH endpoint
  onCardUpdate: (messageId: string, updatedCard: RichCard) => void;
}
```

Receipt card renders three action chips:
- **"تأكيد ✓"** — triggers `PATCH /api/chat/messages/[id]/card { status: "confirmed" }`, then invalidates `["transactions"]` query
- **"تعديل ✏"** — toggles inline edit mode for `merchant` and `amount` fields
- **"حذف ✗"** — triggers `PATCH /api/chat/messages/[id]/card { status: "deleted" }`

After confirm or delete, the action chips are hidden and replaced by a status label ("تم الحفظ ✓" or "تم الإلغاء").

### `MessageBubble` props (updated)

```typescript
interface MessageBubbleProps {
  message: ChatMessage;
  onCardUpdate: (messageId: string, updatedCard: RichCard) => void;
}
```

Passes `onCardUpdate` and `messageId` down to `RichCardRenderer`.
