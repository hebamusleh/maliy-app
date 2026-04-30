# Implementation Plan: AI Conversational Chat Interface

**Branch**: `004-ai-chat-interface` | **Date**: 2026-04-30 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `specs/004-ai-chat-interface/spec.md`

## Summary

Enhance the existing conversational chat panel (`ChatPanel.tsx` + `/api/chat`) to complete all planned features: transaction intent detection with AI-generated receipt cards, functional Confirm/Edit/Delete actions on receipt cards, voice input via Web Speech API, proactive AI insights, and updated suggestion pills. **No architecture replacement** — all work extends the existing streaming chat, Supabase `chat_messages` table, and OpenRouter integration.

## Technical Context

**Language/Version**: TypeScript / Next.js 15 (App Router)
**Primary Dependencies**: TanStack Query v5, Tailwind CSS v4, Web Speech API (browser native), OpenRouter (via `OPENROUTER_API_KEY`), Supabase JS v2
**Storage**: Supabase `chat_messages` table (`rich_card JSONB`) — no new migrations
**Testing**: Jest + React Testing Library (existing setup)
**Target Platform**: Web browser, RTL (Arabic), desktop-first; chat panel 400px wide (existing)
**Project Type**: Next.js fullstack web application
**Performance Goals**: Transaction detection + extraction < 3s; chat panel interactive within 2s of page load
**Constraints**: No auth — `anon-user` fallback throughout; Web Speech API is browser-native (no polyfill)
**Scale/Scope**: Single-user demo; chat history capped at last 50 messages

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Arabic-First RTL UI** | PASS | All new UI uses Arabic text, RTL-safe classes; pulsing mic animation uses neutral colors |
| **II. Single Project Transactions** | PASS | Confirm flow requires project selection from suggestions; project_id passed to POST /api/transactions |
| **III. Layered Classification** | PASS | Extraction uses AI (OpenRouter), satisfying the Claude API layer |
| **IV. Knowledge Graph Integration** | N/A | Not in scope for this feature |
| **V. Core Voice Input** | PASS | Mic button + Web Speech API implemented as primary voice entry point |

All applicable gates pass.

## Project Structure

### Documentation (this feature)

```text
specs/004-ai-chat-interface/
├── plan.md                    # This file
├── spec.md                    # Feature specification
├── research.md                # Codebase audit + decisions
├── data-model.md              # Extended type definitions
├── quickstart.md              # End-to-end test scenarios
├── tasks.md                   # Implementation tasks (next step)
├── contracts/
│   └── api-contracts.md       # API + component interface contracts
└── checklists/
    └── requirements.md        # Quality checklist
```

### Source Code Changes

```text
src/
├── types/
│   └── index.ts                          # MODIFY: extend TxReceiptCard (category, confidence, status); add InsightCard; update RichCard union
│
├── app/
│   └── api/
│       ├── chat/
│       │   ├── route.ts                  # MODIFY: add transaction intent detection + structured extraction before streaming
│       │   ├── messages/
│       │   │   └── route.ts              # UNCHANGED
│       │   ├── messages/
│       │   │   └── [id]/
│       │   │       └── card/
│       │   │           └── route.ts      # NEW: PATCH endpoint — confirm (creates transaction) or delete a receipt card
│       │   └── insights/
│       │       └── route.ts              # NEW: GET endpoint — detect patterns, insert AI insight messages
│
└── components/
    └── layout/
        └── ChatPanel.tsx                 # MODIFY: all enhancements (voice, insights trigger, card actions, updated pills)
```

**Structure Decision**: All changes are confined to `src/components/layout/ChatPanel.tsx` and `src/app/api/chat/`. No new components needed — the `RichCardRenderer` and `ChatComposer` are internal sub-components of `ChatPanel.tsx` and will be enhanced in-place.

## Complexity Tracking

No constitution violations. No unjustified complexity.

---

## Implementation Phases

### Phase A — Type System Extension

**Goal**: Extend `TxReceiptCard` with `category`, `confidence`, `status`; add `InsightCard`; update `RichCard` union. All downstream code will then have full type safety.

**A1** — Update `src/types/index.ts`:

```typescript
// TxReceiptCard — add three fields
export interface TxReceiptCard {
  type: "tx_receipt";
  transaction_id: string | null;   // null = pending, set after confirm
  merchant: string;
  amount: number;
  category: string;                // Arabic label e.g. "مطاعم"
  confidence: number;              // 0–100
  suggestions: Array<{ label: string; project_id: string }>;
  status: "pending" | "confirmed" | "deleted";
}

// InsightCard — new
export interface InsightCard {
  type: "insight";
  pattern: "repeated_merchant" | "budget_warning" | "anomaly";
  action_label: string;
  action_payload: Record<string, unknown>;
}

// RichCard union — add InsightCard
export type RichCard = TxReceiptCard | ChipsCard | InsightCard;
```

---

### Phase B — Transaction Intent Detection (API)

**Goal**: `/api/chat` detects Arabic transaction messages, runs structured AI extraction, saves the receipt card alongside the streaming text response.

**B1** — Add intent detection helper in `src/app/api/chat/route.ts`:

```typescript
const TX_PATTERNS = /دفعت|صرفت|اشتريت|استلمت|حولت|سددت|وصل راتبي/;

function isTransactionIntent(message: string): boolean {
  return TX_PATTERNS.test(message) && /\d/.test(message);
}
```

**B2** — Add structured extraction function (non-streaming OpenRouter call):

Prompt: given the user's Arabic message, return JSON with:
```json
{
  "merchant": "string",
  "amount": "number (negative for expense, positive for income)",
  "category": "Arabic category label",
  "confidence": "0-100 integer"
}
```

Use `response_format: { type: "json_object" }` with OpenRouter. Fallback values if extraction fails: `merchant = cleaned message substring`, `amount = extracted number`, `category = "أخرى"`, `confidence = 0`.

**B3** — Fetch user's active projects (for `suggestions` field):
```typescript
const { data: projects } = await supabase
  .from("projects")
  .select("id, name, icon")
  .eq("user_id", user.id)
  .limit(5);
```

**B4** — After streaming completes, if transaction was detected, update the saved assistant message to include the `rich_card`:
```typescript
await supabase
  .from("chat_messages")
  .update({ rich_card: receiptCard })
  .eq("id", assistantMessageId);
```

---

### Phase C — Card Action API

**Goal**: New `PATCH /api/chat/messages/[id]/card` endpoint that confirms or deletes a receipt card.

**C1** — Create `src/app/api/chat/messages/[id]/card/route.ts`:

```
PATCH body: { status: "confirmed" | "deleted", project_id?: string }

On "confirmed":
  1. Validate card is status "pending"
  2. POST to transactions table: { merchant, amount, date: today, project_id, category, status: "classified" }
  3. Update chat_messages.rich_card: set status = "confirmed", transaction_id = new tx id
  4. Return { message: updated, transaction: created }

On "deleted":
  1. Validate card is status "pending"
  2. Update chat_messages.rich_card: set status = "deleted"
  3. Return { message: updated }
```

---

### Phase D — Voice Input

**Goal**: Mic button with recording animation in `ChatComposer`; uses Web Speech API with Arabic locale; hidden if unsupported.

**D1** — Add voice state and refs to `ChatComposer`:

```typescript
const [isRecording, setIsRecording] = useState(false);
const [isVoiceSupported, setIsVoiceSupported] = useState(false);
const recognitionRef = useRef<SpeechRecognition | null>(null);

useEffect(() => {
  const SpeechRecognition = window.SpeechRecognition ?? window.webkitSpeechRecognition;
  setIsVoiceSupported(!!SpeechRecognition);
  if (!SpeechRecognition) return;
  const recognition = new SpeechRecognition();
  recognition.lang = "ar-SA";
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.onresult = (event) => {
    const transcript = Array.from(event.results)
      .map((r) => r[0].transcript)
      .join("");
    setValue(transcript);
    if (event.results[0].isFinal) {
      setIsRecording(false);
      onSend(transcript);
      setValue("");
    }
  };
  recognition.onerror = () => setIsRecording(false);
  recognition.onend = () => setIsRecording(false);
  recognitionRef.current = recognition;
}, []);
```

**D2** — Mic button JSX (rendered only when `isVoiceSupported`):

```tsx
{isVoiceSupported && (
  <button
    onClick={() => {
      if (isRecording) {
        recognitionRef.current?.stop();
        setIsRecording(false);
      } else {
        recognitionRef.current?.start();
        setIsRecording(true);
      }
    }}
    className="w-10 h-10 rounded-xl flex items-center justify-center relative"
    style={{
      background: isRecording ? "var(--rose)" : "var(--paper-3)",
      border: isRecording ? "none" : "1px solid var(--line)",
    }}
    aria-label={isRecording ? "إيقاف التسجيل" : "إدخال صوتي"}
  >
    {/* mic SVG icon */}
    {isRecording && (
      <span className="absolute inset-0 rounded-xl animate-ping opacity-30"
        style={{ background: "var(--rose)" }} />
    )}
  </button>
)}
```

---

### Phase E — Proactive Insights

**Goal**: `GET /api/chat/insights` detects patterns and inserts AI messages; `ChatPanel` calls it once on mount.

**E1** — Create `src/app/api/chat/insights/route.ts`:

```
GET /api/chat/insights

1. Query last 30 days of transactions for user
2. Check pattern 1 (repeated merchant):
   - Group by merchant, count, and sum where date >= 7 days ago
   - If any merchant appears ≥ 3 times → detect pattern
3. Check pattern 2 (budget warning):
   - Query projects with budget_limit; compute spend; if spend/budget >= 0.85 → detect
4. Check pattern 3 (anomaly):
   - Compute daily average spend; check if any single tx > 3× average → detect
5. For each detected pattern:
   - Check if assistant message with rich_card.type="insight" and rich_card.pattern=X
     was inserted in the last 24 hours → skip if yes
   - Otherwise: insert assistant message with appropriate Arabic text + InsightCard
6. Return { insights_sent: N, patterns: [...] }
```

**E2** — ChatPanel mount trigger:

```typescript
const insightQuery = useQuery({
  queryKey: ["chat-insights"],
  queryFn: async () => {
    const res = await fetch("/api/chat/insights");
    return res.json();
  },
  staleTime: 5 * 60_000,  // re-check every 5 minutes
});

// Invalidate messages when insights are sent
useEffect(() => {
  if (insightQuery.data?.insights_sent > 0) {
    queryClient.invalidateQueries({ queryKey: ["chat-messages"] });
  }
}, [insightQuery.data]);
```

---

### Phase F — Receipt Card UI Actions

**Goal**: `RichCardRenderer.tx_receipt` shows Confirm/Edit/Delete chips; mutations call the card PATCH endpoint.

**F1** — Add `messageId` and `onCardUpdate` props to `RichCardRenderer` and `MessageBubble`.

**F2** — Receipt card renders:
- Merchant name + amount (existing)
- Category label + confidence badge (new)
- Project suggestion buttons (existing, but now wire to pre-select project_id on confirm)
- Action chips row (new): **تأكيد ✓** | **تعديل ✏** | **حذف ✗**

**F3** — Confirm flow:
```typescript
const confirmMutation = useMutation({
  mutationFn: async ({ messageId, projectId }: { messageId: string; projectId?: string }) => {
    const res = await fetch(`/api/chat/messages/${messageId}/card`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "confirmed", project_id: projectId }),
    });
    return res.json();
  },
  onSuccess: (data) => {
    onCardUpdate(messageId, data.message.rich_card);
    queryClient.invalidateQueries({ queryKey: ["transactions"] });
    toast.success("تم حفظ المعاملة");
  },
});
```

**F4** — Edit flow (inline):
```typescript
const [editing, setEditing] = useState(false);
const [editMerchant, setEditMerchant] = useState(card.merchant);
const [editAmount, setEditAmount] = useState(card.amount);
// When editing=true, show input fields instead of static text
// "حفظ" button → confirmMutation with edited values (PATCH endpoint accepts optional overrides)
```

**F5** — Delete flow:
```typescript
const deleteMutation = useMutation({
  mutationFn: async (messageId: string) => {
    const res = await fetch(`/api/chat/messages/${messageId}/card`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "deleted" }),
    });
    return res.json();
  },
  onSuccess: (data) => {
    onCardUpdate(messageId, data.message.rich_card);
  },
});
```

**F6** — Status display:
- `status === "confirmed"`: hide action chips; show green "تم الحفظ ✓" label + transaction link
- `status === "deleted"`: hide card content; show muted "تم الإلغاء" label

---

### Phase G — Suggestion Pills Update

**Goal**: Replace the 3 current generic pills with the 4 spec-required action pills.

**G1** — Update `ChatComposer` pill array:

```typescript
const SUGGESTION_PILLS = [
  { label: "تقرير أسبوعي", prompt: "أعطني تقريراً مفصلاً عن إنفاقي خلال الأسبوع الماضي" },
  { label: "ربط بطاقة", prompt: "أريد ربط بطاقة بنكية بأحد مشاريعي" },
  { label: "تحديد هدف ادخار", prompt: "ساعدني في تحديد هدف ادخار شهري مناسب لدخلي" },
  { label: "جدولة فاتورة", prompt: "أريد جدولة دفع فاتورة متكررة" },
];
```

Tapping a pill calls `onSend(pill.prompt)`.

---

## Post-Phase Constitution Re-Check

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Arabic-First RTL UI** | PASS | Mic animation, receipt card fields, insight messages — all Arabic/RTL |
| **II. Single Project Transactions** | PASS | Confirm action requires project selection; project_id passed to transaction creation |
| **III. Layered Classification** | PASS | Extraction prompt uses OpenRouter (Claude API layer) |
| **V. Core Voice Input** | PASS | Mic button + Web Speech API ar-SA locale + recording animation |

---

## Artifacts

| Artifact | Path | Status |
|----------|------|--------|
| Spec | `specs/004-ai-chat-interface/spec.md` | Complete |
| Research | `specs/004-ai-chat-interface/research.md` | Complete |
| Data Model | `specs/004-ai-chat-interface/data-model.md` | Complete |
| API Contracts | `specs/004-ai-chat-interface/contracts/api-contracts.md` | Complete |
| Quickstart | `specs/004-ai-chat-interface/quickstart.md` | Complete |
| Tasks | `specs/004-ai-chat-interface/tasks.md` | Pending — run `/speckit-tasks` |
