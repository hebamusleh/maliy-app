# Research: AI Conversational Chat Interface

**Branch**: `004-ai-chat-interface` | **Date**: 2026-04-30
**Input**: Feature spec + codebase audit of existing ChatPanel implementation

---

## Codebase Audit Findings

### What Already Exists (Do Not Rebuild)

| Component | File | Status |
|-----------|------|--------|
| Chat panel shell | `src/components/layout/ChatPanel.tsx` | ✅ Exists — streaming, scroll, message bubbles |
| 3-column layout | `src/components/layout/Layout.tsx` | ✅ `280px 1fr 400px` grid, ChatPanel always rendered |
| SSE streaming API | `src/app/api/chat/route.ts` | ✅ OpenRouter + financial context system prompt |
| Messages API | `src/app/api/chat/messages/route.ts` | ✅ GET last 50 from DB |
| DB table | `chat_messages` | ✅ `id, user_id, role, content, rich_card JSONB, created_at` |
| Types | `src/types/index.ts` | ✅ `ChatMessage`, `TxReceiptCard`, `ChipsCard`, `RichCard` |
| Typing indicator | `ChatPanel.tsx` streaming bubble | ✅ Dots animation while streaming |
| Rich card renderer | `RichCardRenderer` in `ChatPanel.tsx` | ⚠️ Renders tx_receipt and chips but buttons are non-functional |

### Confirmed Gaps (Must Be Fixed)

| Gap | Description |
|-----|-------------|
| **Voice input** | No mic button, no Web Speech API usage anywhere |
| **Transaction intent detection** | `/api/chat` is Q&A-only; never parses "دفعت 50 ريال" into a `tx_receipt` card |
| **Receipt card fields** | `TxReceiptCard` missing `category`, `confidence_score`, `status` fields |
| **Confirm/Edit/Delete actions** | `RichCardRenderer` project buttons have no `onClick`; no Confirm/Edit/Delete chips |
| **Card status persistence** | No API endpoint to update `rich_card` status after user action |
| **Proactive insights** | No pattern-detection trigger; AI only responds to messages |
| **Suggestion pills** | Current 3 pills are generic Q&A; spec requires 4 action-oriented pills |

---

## Decision Log

### D1: Transaction Intent Detection Strategy

**Decision**: Two-pass approach — fast regex pre-check, then structured AI extraction.

**Rationale**:
- Regex (Arabic number patterns + payment verbs: دفعت/صرفت/استلمت/حولت) is instant and avoids extra API latency for non-transaction messages
- If regex matches, a second OpenRouter call with a structured JSON extraction prompt extracts: `merchant`, `amount`, `category`, `confidence` (0–100)
- The existing streaming Q&A flow remains untouched for non-transaction messages

**Alternatives considered**:
- Single combined prompt: Returns structured JSON for transactions OR prose for questions, but complicates streaming and requires response parsing mid-stream
- Always-structured output: Breaks the existing streaming flow and increases latency for every message
- Client-side NLP: No suitable Arabic NLP library available in the browser

**Transaction patterns detected**:
```
Payment: دفعت / صرفت / اشتريت / دفع / سددت
Income:  استلمت / وصل راتبي / حولوا لي / استلمت مبلغ
Transfer: حولت / رحلت
```

---

### D2: Voice Input Implementation

**Decision**: Web Speech API (`window.SpeechRecognition`) with Arabic (`ar-SA`) locale; hide mic button entirely if API unavailable (per spec Edge Cases).

**Rationale**: Constitution Principle V explicitly mandates Web Speech API. No additional library needed.

**Behavior**:
- Tap mic → start recognition → pulsing amber ring animation
- Tap mic again OR silence timeout → stop recognition → feed transcript into `onSend`
- `interimResults: true` to show live transcription in input field during recording
- On `onerror` or API unavailable: show Arabic error toast; mic button hidden on mount if unsupported

---

### D3: Receipt Card Action Flow

**Decision**: Client-side status state + a `PATCH /api/chat/messages/[id]/card` endpoint to persist status.

**Rationale**:
- Card status (`pending` / `confirmed` / `deleted`) must survive remounts and page refreshes
- Storing status in the `rich_card` JSONB column reuses the existing schema with no migration
- Confirming a card calls `POST /api/transactions` then patches card status to `confirmed`
- Deleting patches status to `deleted`; no transaction is created
- Editing opens inline editable fields; saving confirms the edited values

**Edit flow**: Inline edit within the receipt card — no modal. Only `merchant` and `amount` are editable (category and project are re-suggested by AI).

---

### D4: Proactive Insights Delivery

**Decision**: `GET /api/chat/insights` — called once per ChatPanel mount — inserts AI messages to DB if pattern detected and not sent in last 24 hours.

**Rationale**:
- Checking "sent in last 24h" prevents duplicate insight spam on every page refresh
- Storing insights in `chat_messages` (role: `assistant`) reuses existing rendering pipeline
- `sessionStorage` flag per insight type prevents re-checking the API within the same session

**Patterns checked** (v1):
1. Same merchant ≥ 3 times in 7 days → suggest project assignment
2. Project budget usage ≥ 85% → warn and suggest budget review
3. Largest single expense this month > 3× daily average → flag anomaly

---

### D5: Suggestion Pills Update

**Decision**: Replace current 3 generic pills with the 4 spec-defined action pills.

**Current**: "كيف حال ميزانيتي؟", "حلل إنفاقي هذا الشهر", "متى موعد الراتب؟"

**New**: "تقرير أسبوعي", "ربط بطاقة", "تحديد هدف ادخار", "جدولة فاتورة"

**Rationale**: Pills should drive action flows as defined in the spec user stories, not just pre-fill generic questions. The AI will handle the conversational flow once a pill is tapped.

---

### D6: Message Persistence Strategy

**Decision**: Keep DB persistence (current approach) — do NOT migrate to session-only.

**Rationale**: The current DB-backed approach is superior UX (history survives refresh). The spec assumption of "session-only" was a conservative default. The user explicitly said to avoid replacing the current architecture. The `chat_messages` table with a 50-message limit already manages scope well.

---

## DB Schema — No Migrations Required

All changes fit within the existing `chat_messages.rich_card JSONB` column by extending the `TxReceiptCard` structure client-side. The `status` field (`pending`/`confirmed`/`deleted`) is added to the JSON payload stored in `rich_card`.

No new tables needed. No schema migrations required.
