# Tasks: AI Conversational Chat Interface

**Input**: Design documents from `specs/004-ai-chat-interface/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/api-contracts.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. No test tasks — not requested in the spec.

**Key constraint**: `ChatPanel.tsx` is a single file containing `ChatComposer`, `RichCardRenderer`, and `MessageBubble` sub-components. All tasks that touch this file are marked sequential (no [P]).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies between them)
- **[Story]**: Which user story this task belongs to (US1–US5)

---

## Phase 1: Foundational — Type System Extension

**Purpose**: Extend the shared type definitions that all subsequent tasks depend on. Must complete before any implementation task.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T001Extend `src/types/index.ts` — add `category: string`, `confidence: number` (0–100), and `status: "pending" | "confirmed" | "deleted"` to `TxReceiptCard`; set `transaction_id: string | null` (null = pending); add new `InsightCard` interface `{ type: "insight"; pattern: "repeated_merchant" | "budget_warning" | "anomaly"; action_label: string; action_payload: Record<string, unknown> }`; update `RichCard` union to `TxReceiptCard | ChipsCard | InsightCard`

**Checkpoint**: `src/types/index.ts` compiles with no errors. `TxReceiptCard` has all 7 fields. `InsightCard` and updated `RichCard` union are exported.

---

## Phase 2: User Story 1 — Log Transaction via Text (Priority: P1) 🎯 MVP

**Goal**: User types "دفعت 80 ريال مطعم" → AI detects transaction intent → responds with a receipt card showing merchant, amount, category, confidence score, and project suggestions → user taps Confirm/Edit/Delete to action the card.

**Independent Test**: Type "دفعت 120 ريال مطاعم البيك" in chat. Verify AI receipt card appears with amount −120, a food category, confidence score, and project suggestions. Tap Confirm → card shows "تم الحفظ ✓". Navigate to Transactions page → verify the transaction exists.

### Implementation for User Story 1

- [x] T002 [P] [US1] Update `src/app/api/chat/route.ts` — add `isTransactionIntent(message: string): boolean` helper that returns true when message matches Arabic payment/income regex (`/دفعت|صرفت|اشتريت|استلمت|حولت|سددت|وصل راتبي/`) AND contains a digit; add `extractTransaction(message, apiKey): Promise<{merchant,amount,category,confidence}>` that calls OpenRouter with `response_format:{type:"json_object"}`, a structured extraction system prompt in Arabic, and returns the parsed fields (fallback: `merchant = message.slice(0,30)`, `amount = 0`, `category = "أخرى"`, `confidence = 0`); after streaming completes, if intent was detected: fetch user's projects (`supabase.from("projects").select("id,name,icon").eq("user_id",user.id).limit(5)`), build `TxReceiptCard` `{type:"tx_receipt", transaction_id:null, merchant, amount, category, confidence, suggestions:[{label:p.icon+" "+p.name, project_id:p.id}], status:"pending"}`, and update the saved assistant message: `supabase.from("chat_messages").update({rich_card:receiptCard}).eq("id", assistantMessageId)`; save `assistantMessageId` by adding `.select().single()` to the insert call

- [x] T003 [P] [US1] Create `src/app/api/chat/messages/[id]/card/route.ts` — export `const dynamic = "force-dynamic"`; add PATCH handler: get user via `getRequestUser()`; fetch message and validate ownership and that `rich_card.type === "tx_receipt"` and `rich_card.status === "pending"` (return 404 if not found, 400 if wrong type, 409 if already actioned); parse body `{status: "confirmed"|"deleted", project_id?: string, merchant?: string, amount?: number}`; on "confirmed": insert to `transactions` table `{user_id, merchant: body.merchant ?? card.merchant, amount: body.amount ?? card.amount, date: new Date().toISOString().split("T")[0], project_id: body.project_id ?? null, status: body.project_id ? "classified" : "pending"}` then update `chat_messages.rich_card` via `JSON.stringify({...card, status:"confirmed", transaction_id: newTx.id})`; on "deleted": update rich_card to `{...card, status:"deleted"}`; return `{message: updatedMessage, transaction?: createdTx}`

- [x] T004 [US1] Update `ChatPanel.tsx` — (a) Add `messageId: string` and `onCardUpdate: (id: string, card: RichCard) => void` props to `RichCardRenderer`; (b) In the `tx_receipt` branch of `RichCardRenderer`: below amount show `category` label (small badge) and `confidence` as `{confidence}%` text in muted style; add `[selectedProjectId, setSelectedProjectId]` state; make project suggestion buttons selectable (highlight selected with `var(--amber)` border); add three action chips row: "تأكيد ✓" / "تعديل ✏" / "حذف ✗"; add `useMutation` for confirm that calls `PATCH /api/chat/messages/${messageId}/card` with `{status:"confirmed", project_id: selectedProjectId}`, on success calls `onCardUpdate` and `queryClient.invalidateQueries({queryKey:["transactions"]})` and shows `toast.success("تم حفظ المعاملة")`; add `useMutation` for delete that calls PATCH with `{status:"deleted"}`, on success calls `onCardUpdate`; add `[editing, setEditing]` state for inline edit mode: when editing show `<input>` fields for merchant and amount, a "حفظ" button that triggers confirm with edited values, and "إلغاء" to exit edit mode; when `card.status === "confirmed"` replace chips with green "تم الحفظ ✓" label and hide project buttons; when `card.status === "deleted"` replace card body with muted "تم الإلغاء" text; (c) Update `MessageBubble` to accept and pass `messageId` and `onCardUpdate` to `RichCardRenderer`; (d) In `ChatPanel` main component: switch from relying solely on TanStack Query cache to also maintaining `localMessages` state initialized from query data; add `handleCardUpdate(messageId, updatedCard)` that merges the updated card into `localMessages`; render from `localMessages` (or merged `messages + localMessages`) so card status updates are instant without a refetch; pass `handleCardUpdate` into each `MessageBubble`

**Checkpoint**: Typing "دفعت 50 ريال كافيه" produces a receipt card with category, confidence, and three actionable chips. Confirm saves the transaction. Delete dismisses the card. Editing merchant/amount before confirming works correctly.

---

## Phase 3: User Story 2 — Voice Input (Priority: P2)

**Goal**: Mic button in chat input with recording animation; tapping records Arabic speech; transcript auto-submitted as a message.

**Independent Test**: Tap mic button — amber pulsing ring appears. Speak "دفعت مئة ريال". Transcript appears and is submitted. If browser does not support Web Speech API, mic button is not shown.

### Implementation for User Story 2

- [x] T005 [US2] Update `ChatPanel.tsx` `ChatComposer` sub-component — add `isVoiceSupported` state (default false) and `isRecording` state (default false); add `recognitionRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null)`; add `useEffect` on mount: check `window.SpeechRecognition ?? (window as {webkitSpeechRecognition?: typeof SpeechRecognition}).webkitSpeechRecognition`; if found set `isVoiceSupported(true)`, create instance with `lang:"ar-SA"`, `interimResults:true`, `continuous:false`; wire `onresult`: collect `event.results[i][0].transcript` into running string and call `setValue(transcript)` for interim; when `event.results[i].isFinal` is true call `setIsRecording(false)` then `onSend(transcript)` then `setValue("")`; wire `onerror` and `onend` to `setIsRecording(false)`; render mic button only when `isVoiceSupported` — place it between the text input and the send button; button background: `var(--rose)` when recording, `var(--paper-3)` when idle; add pulsing ring: `<span className="absolute inset-0 rounded-xl animate-ping opacity-30" style={{background:"var(--rose)"}} />` rendered only when `isRecording`; on tap: if recording call `recognition.stop()`, else call `recognition.start()` and `setIsRecording(true)`; use mic SVG icon (stroke="currentColor", path for microphone shape)

**Checkpoint**: Mic button visible (if browser supports it). Tapping starts recording animation. Speaking Arabic text fills the input and submits automatically on silence.

---

## Phase 4: User Story 3 — Proactive AI Insights (Priority: P3)

**Goal**: AI proactively sends insight messages when spending patterns are detected (repeated merchant, budget warning, anomaly) — appears without user prompting when chat loads.

**Independent Test**: Seed data → open app → within 5 seconds of chat loading an unsolicited AI insight message appears (e.g., "دفعتَ في ستاربكس 3 مرات هذا الأسبوع..."). Tapping the action button on the insight executes the suggested action.

### Implementation for User Story 3

- [x] T006 [P] [US3] Create `src/app/api/chat/insights/route.ts` — export `const dynamic = "force-dynamic"`; add GET handler; get user via `getRequestUser()`; fetch last 30 days of transactions: `supabase.from("transactions").select("merchant,amount,project_id,date").eq("user_id",user.id).gte("date", thirtyDaysAgo)`; **Pattern 1 (repeated_merchant)**: group by merchant for transactions in last 7 days; find merchants appearing ≥ 3 times; **Pattern 2 (budget_warning)**: fetch projects with budget_limit; compute spend per project from transactions with `amount < 0`; flag any project where `spend/budget_limit >= 0.85`; **Pattern 3 (anomaly)**: compute `dailyAvg = totalExpenses / 30`; flag any single transaction where `Math.abs(amount) > 3 * dailyAvg`; for each detected pattern: check if an assistant message with `rich_card->>'pattern' = patternKey` was inserted in `chat_messages` in the last 24 hours (`created_at > now() - interval '24 hours'`); if not, build Arabic insight text and `InsightCard` payload, then `supabase.from("chat_messages").insert({user_id, role:"assistant", content: insightText, rich_card: insightCard})`; return `{insights_sent: count, patterns: detectedPatterns}`

- [x] T007 [US3] Update `ChatPanel.tsx` main component — add insights query: `useQuery({queryKey:["chat-insights"], queryFn: () => fetch("/api/chat/insights").then(r=>r.json()), staleTime: 5*60_000, refetchOnWindowFocus: false})`; add `useEffect` that watches `insightData?.insights_sent`: when `> 0` call `queryClient.invalidateQueries({queryKey:["chat-messages"]})`; in `RichCardRenderer`: add `"insight"` branch — render insight message text; if `card.action_label` exists render an amber-colored action button that on click calls `onSend(card.action_label + " — " + JSON.stringify(card.action_payload))` (or a fixed prompt based on pattern); style insight card with `var(--amber-2)` left border or subtle amber tint to differentiate from regular messages

**Checkpoint**: After seeding data, opening the chat causes the insights API to fire and 1–3 AI insight messages appear without the user typing anything. Insight messages display an action button.

---

## Phase 5: User Story 4 — Financial Q&A (Priority: P4)

**Goal**: AI answers financial questions with data specific to the user's records — categories, per-project spending, and transaction details — not just monthly totals.

**Independent Test**: With seeded data, type "ما أكثر فئة صرفت فيها هذا الشهر؟" → AI names the correct category. Type "أي مشروع استهلك أكثر؟" → AI names the correct project with its spend.

### Implementation for User Story 4

- [x] T008 [US4] Update `src/app/api/chat/route.ts` — enhance the system prompt context section: (a) fetch per-category spend this month: `supabase.from("transactions").select("category_id, amount, spending_categories(name_ar)").eq("user_id", user.id).gte("date", monthStart).lt("amount", 0)` — aggregate by `category_id`, take top 3, format as "الفئة: X — المبلغ: Y ريال"; (b) fetch per-project spend: `supabase.from("transactions").select("project_id, amount, projects(name, budget_limit)").eq("user_id", user.id).gte("date", monthStart)` — aggregate spend per project, compute usage %  and include budget_limit; (c) add both sections to the `systemPrompt` string beneath the existing monthly totals; keep the prompt concise (max 400 extra tokens) by limiting to top 3 categories and all projects

**Checkpoint**: Asking "ما أكثر فئة صرفت فيها؟" returns an answer naming the category with the highest spend in the current month. Asking "كم أنفقت على مشروع العمل؟" returns the correct project-scoped total.

---

## Phase 6: User Story 5 — Suggestion Pills (Priority: P5)

**Goal**: Four action-oriented suggestion pills displayed above the chat input: تقرير أسبوعي, ربط بطاقة, تحديد هدف ادخار, جدولة فاتورة.

**Independent Test**: Open chat panel — verify 4 pills visible. Tap "تقرير أسبوعي" — AI responds with a weekly spend summary. Tap "تحديد هدف ادخار" — AI asks a follow-up question to help set a savings goal.

### Implementation for User Story 5

- [x] T009 [US5] Update `ChatPanel.tsx` `ChatComposer` sub-component — replace the current `["كيف حال ميزانيتي؟", "حلل إنفاقي هذا الشهر", "متى موعد الراتب؟"]` array with a typed constant: `const SUGGESTION_PILLS = [{label:"تقرير أسبوعي", prompt:"أعطني تقريراً مفصلاً عن مصاريفي خلال الأسبوع الماضي مع تصنيف حسب الفئة والمشروع"}, {label:"ربط بطاقة", prompt:"أريد ربط بطاقة بنكية بأحد مشاريعي، كيف أفعل ذلك؟"}, {label:"تحديد هدف ادخار", prompt:"ساعدني في تحديد هدف ادخار شهري مناسب بناءً على دخلي ومصاريفي الحالية"}, {label:"جدولة فاتورة", prompt:"أريد جدولة دفع فاتورة متكررة أو تذكيراً بموعد دفع ثابت"}]`; map over `SUGGESTION_PILLS` rendering pill buttons that call `onSend(pill.prompt)` on click; keep the same pill styling (`rounded-xl px-3 py-2 font-heading text-[12.5px]` with `var(--paper)` background and `var(--line)` border)

**Checkpoint**: Four pills visible. Each pill sends a contextually rich Arabic prompt. AI responds meaningfully to each.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: RTL consistency, loading states, and end-to-end validation.

- [x] T010 [P] Audit RTL layout in all modified components — verify `ms-*`/`me-*` instead of `ml-*`/`mr-*` in `ChatPanel.tsx` new elements (mic button margin, chip gaps, insight card border); verify `font-heading` on pill labels and chip labels; verify `font-numbers` on amount and confidence score displays; verify `var(--ink)`, `var(--paper)`, `var(--amber)`, `var(--rose)`, `var(--sage)`, `var(--line)` token usage throughout new UI elements; fix any violations

- [x] T011 Validate full quickstart.md flow end-to-end: seed data (`POST /api/seed`) → type transaction in chat → verify receipt card fields (merchant, amount, category, confidence, project suggestions) → tap Confirm → verify transaction in list → verify mic button present/hidden depending on browser → verify 1+ insight message appears on chat load → tap "تقرير أسبوعي" pill → verify AI response → ask "ما أكثر فئة صرفت فيها؟" → verify AI names correct category

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — start immediately
- **US1 (Phase 2)**: Depends on T001 (types) — BLOCKS Phases 3, 4
- **US2 (Phase 3)**: Depends on T001 and T004 (ChatPanel US1 changes must land first, same file)
- **US3 (Phase 4)**: T006 can run in parallel with US2 (different file); T007 depends on T005 (same file)
- **US4 (Phase 5)**: Depends on T002 (same file `/api/chat/route.ts`)
- **US5 (Phase 6)**: Depends on T007 (same file `ChatPanel.tsx`)
- **Polish (Phase 7)**: Depends on all story phases being complete

### User Story Dependencies

- **US1 (P1)**: After T001. Blocks ChatPanel changes for US2, US3, US5.
- **US2 (P2)**: After T004 (ChatPanel must have US1 changes committed first — same file).
- **US3 (P3)**: T006 (new file) parallel with US2; T007 after T005 (same file).
- **US4 (P4)**: After T002 (same file). Fully independent of ChatPanel tasks.
- **US5 (P5)**: After T007 (same file).

### Within Each User Story

- API routes before their UI consumers (T002/T003 before T004)
- ChatPanel changes: T004 → T005 → T007 → T009 (strictly sequential, same file)
- New file tasks: T003, T006 can run in parallel with same-file tasks

### Parallel Opportunities

- T002 [P] and T003 [P]: different files within US1 — parallelizable
- T006 [P]: new file — parallelizable with T005 (different files)
- T010 [P]: polish audit — parallelizable with T011

---

## Parallel Examples

### Phase 2 — US1 (2 parallel tracks, then sequential)

```
Track A: T002 — /api/chat/route.ts (intent detection + extraction)
Track B: T003 — /api/chat/messages/[id]/card/route.ts (new endpoint)

→ then T004 (ChatPanel — receipt card UI, depends on T002 being done)
```

### Phase 4 — US3 (parallel start, then sequential)

```
Track A: T006 — /api/chat/insights/route.ts (new file)
Track B: T005 — ChatPanel voice input (finishing US2)

→ then T007 (ChatPanel — insights trigger, same file as T005)
```

---

## Implementation Strategy

### MVP First (US1 Only — Phases 1–2)

1. Complete Phase 1: Extend types (T001)
2. Complete Phase 2 in parallel: T002 + T003, then T004
3. **STOP and VALIDATE**: Type a transaction → receipt card appears → Confirm saves it
4. Demo-ready: core transaction logging via chat works

### Incremental Delivery

1. Phase 1: Foundation → types ready
2. Phase 2 (US1): Transaction logging → Functional MVP
3. Phase 3 (US2): Voice input → Mobile-friendly
4. Phase 4 (US3): Proactive insights → Intelligent advisor
5. Phase 5 (US4): Rich Q&A context → Data-aware answers
6. Phase 6 (US5): Suggestion pills → Discoverable actions
7. Phase 7: Polish → Production-ready

---

## Notes

- `[P]` tasks = different files, no blocking dependencies between them
- `[Story]` label traces each task back to its spec user story
- `ChatPanel.tsx` tasks (T004, T005, T007, T009) are strictly sequential — same file
- `/api/chat/route.ts` tasks (T002, T008) are strictly sequential — same file
- Design tokens: `var(--ink)`, `var(--paper)`, `var(--paper-2)`, `var(--amber)`, `var(--rose)`, `var(--sage)`, `var(--line)`
- RTL spacing: `ms-*`/`me-*` not `ml-*`/`mr-*`; font classes: `font-heading`, `font-numbers`
- Voice mic button must be conditionally rendered — never show an error state for unsupported browsers, just hide
- All receipt card mutations must use the PATCH endpoint — never modify `chat_messages` directly from the client
