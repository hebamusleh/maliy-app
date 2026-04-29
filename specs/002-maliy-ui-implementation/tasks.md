# Tasks: ماليّ Full UI Implementation & Backend Integration

**Input**: Design documents from `/specs/002-maliy-ui-implementation/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅ | contracts/ ✅ | quickstart.md ✅

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US8)
- Exact file paths are included in all task descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization — design tokens, fonts, types, and dependencies. Must complete before any page work.

- [ ] T001 Add Recharts and date-fns to package.json by running `pnpm add recharts date-fns react-hot-toast` from repo root
- [ ] T002 [P] Replace the commented-out Google Fonts `<link>` in `src/app/layout.tsx` with `next/font/google` imports for Reem_Kufi, Noto_Naskh_Arabic, and Fraunces; apply CSS variables `--font-heading`, `--font-body`, `--font-numbers`
- [ ] T003 [P] Expand `src/app/globals.css` with the full design token set from prototype: `--ink`, `--ink-2`, `--ink-3`, `--paper`, `--paper-2`, `--paper-3`, `--amber`, `--amber-2`, `--amber-soft`, `--rose`, `--sage`, `--line`, `--line-strong`, `--shadow`, `--shadow-lg`; remove dark-mode override block
- [ ] T004 Create `src/types/index.ts` with TypeScript interfaces for all new entities: `Debt`, `Alert`, `AlertType`, `ChatMessage`, `TxReceiptCard`, `ChipsCard`, `ForecastSnapshot`, `DashboardData`, `ProjectSummary`, `AnalyticsData`, `CategorySpend`, `ProjectDistribution`, `DailySpend`, `SpendingCategory`, `ClassificationRule` (per data-model.md)
- [ ] T005 Extend `src/types/project.ts` — add fields to `Transaction`: `status`, `confidence_score`, `ai_reasoning`, `payment_last4`, `transaction_time`, `category_id`, `notes`, `classified_at`; update `CreateProjectForm` and `ProjectStats` types

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database migrations, shell layout, and classification infrastructure that ALL user stories depend on.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [ ] T006 Create Supabase migration SQL file `supabase/migrations/002_maliy_full_ui.sql` containing: (1) `spending_categories` table + seed data, (2) `ALTER TABLE transactions` to add new columns, (3) `classification_rules` table, (4) `debts` table, (5) `alerts` table, (6) `chat_messages` table, (7) `forecast_snapshots` table, (8) `transaction_graph` view, (9) `monthly_summary` view, (10) all RLS policies — per data-model.md full DDL
- [ ] T007 Create `src/app/(shell)/layout.tsx` — route group shell layout rendering a 3-column CSS grid (`280px | 1fr | 400px`), with `<Sidebar />` on right (RTL start), `<main id="main-content">{children}</main>` in center, and `<ChatPanel />` stub on left; responsive collapse at 1024px and 640px breakpoints using Tailwind
- [ ] T008 [P] Create `src/components/layout/Sidebar.tsx` — full sidebar component matching prototype: brand mark, navigation items (لوحة التحكم, المعاملات, تنتظر تصنيفك, التحليلات, التنبؤات, الديون, التنبيهات, شخصي, عمل, فريلانس, الإعدادات) with active-state detection via `usePathname()`, badge counts, learning-accuracy card, user footer; uses `next/navigation` Link for client-side routing
- [ ] T009 [P] Create `src/components/layout/TopBar.tsx` — top bar with dynamic greeting (صباح/مساء based on time), global search input (client component, fires `router.push('/transactions?search=...')`), notifications icon-btn linking to `/alerts`, settings icon-btn linking to `/settings`
- [ ] T010 Create `src/lib/classification.ts` — 3-layer classification pipeline function `classifyTransaction(userId, merchant, transactions)`: Layer 1 queries `classification_rules` by merchant_pattern; Layer 2 queries `transactions` history for same merchant (min 3 matches); Layer 3 calls OpenRouter API (`tencent/hy3-preview:free`) with Arabic prompt; returns `{ project_id, confidence, reasoning, layer_used }`
- [ ] T011 [P] Create `src/components/layout/ChatPanel.tsx` — stub implementation: panel structure with header ("ماليّ الذكي" + online indicator), empty message list area, and `<ChatComposer />` placeholder; full implementation in Phase 8 (US8)

**Checkpoint**: Foundation ready — user story implementation can now begin.

---

## Phase 3: User Story 1 — Dashboard Overview (Priority: P1) 🎯 MVP

**Goal**: Authenticated user sees a complete financial overview on the dashboard: net balance, project cards, cash-flow chart, and smart alerts preview.

**Independent Test**: Navigate to `/` → verify BalanceCard renders with monthly balance, 3 project cards with budget progress bars, a 30-day AreaChart from Recharts, and at least 2 alert items. All values dynamic (not hardcoded).

### Implementation for User Story 1

- [ ] T012 [US1] Create `src/app/api/dashboard/route.ts` — `GET` handler that queries Supabase: (1) SUM transactions for current month grouped by income/expense, (2) per-project spend vs budget_limit, (3) COUNT pending transactions, (4) last 2 alerts; returns `DashboardData` JSON per api-contracts.md
- [ ] T013 [P] [US1] Create `src/components/dashboard/BalanceCard.tsx` — dark ink-background card with net balance in Fraunces font, income/expense/savings/pending stats grid, and percentage change badge; receives `BalanceCardProps` per component-contracts.md
- [ ] T014 [P] [US1] Create `src/components/dashboard/ReviewBanner.tsx` — amber gradient banner showing pending count, hidden when `pendingCount === 0`; `onStart` prop navigates to `/review`
- [ ] T015 [P] [US1] Create `src/components/dashboard/ProjectSummaryCards.tsx` — renders up to 3 `ProjectSummary` cards in a responsive 3-col grid; each card has project name, spend amount, budget progress bar `<i style="width: X%">`, remaining amount, and transaction count
- [ ] T016 [US1] Create `src/components/dashboard/CashFlowChart.tsx` — Recharts `<AreaChart>` wrapping `<Area>` for actual balance and forecast balance; `horizon` prop (7/30/90) with tab switcher; danger zones rendered as `<ReferenceArea>`; RTL-friendly via reversed data + `reversed` on `<XAxis>`; receives data from parent
- [ ] T017 [P] [US1] Create `src/components/dashboard/AlertsPreview.tsx` — renders at most 2 `Alert` items (danger/warn/info styled) with icon, title, body, and "عرض الكل" link to `/alerts`
- [ ] T018 [US1] Create `src/app/(shell)/page.tsx` — Dashboard page: `useQuery(['dashboard'])` fetching `/api/dashboard`, assembles `<BalanceCard>`, `<ReviewBanner>`, `<ProjectSummaryCards>`, `<CashFlowChart>`, `<AlertsPreview>`; shows skeleton loaders while loading

**Checkpoint**: Dashboard (`/`) is fully functional with live data. ReviewBanner visible when pending transactions exist.

---

## Phase 4: User Story 2 — Transaction Classification Review (Priority: P1)

**Goal**: User processes unclassified transactions one at a time with AI context and suggestions; each confirmation updates the model.

**Independent Test**: Navigate to `/review` → see first unclassified transaction with merchant, amount, AI reasoning, confidence suggestion; click a project choice → transaction disappears from queue; pending count in sidebar decreases by 1.

### Implementation for User Story 2

- [ ] T019 [US2] Create `src/app/api/transactions/route.ts` — `GET` handler with query params: `project_id`, `status`, `search`, `from`, `to`, `page`, `limit`; returns paginated `Transaction[]` from Supabase joining `projects` and `spending_categories`; `POST` handler to create a manual transaction
- [ ] T020 [US2] Create `src/app/api/transactions/[id]/classify/route.ts` — `POST` handler: (1) validates project_id exists and belongs to user, (2) updates transaction status to 'classified', sets project_id, confidence_score, classified_at, (3) if `apply_to_merchant: true` → classifies ALL pending transactions with same LOWER(merchant), (4) upserts `classification_rules` for merchant → project mapping, (5) invalidates forecast cache; returns `{ transaction, applied_count, rule_created }`
- [ ] T021 [US2] Create `src/app/api/transactions/classify-bulk/route.ts` — `POST` handler: fetches all pending transactions for user, runs `classifyTransaction()` from `src/lib/classification.ts` for each, auto-classifies those with confidence ≥ 0.9, leaves rest pending; returns summary counts
- [ ] T022 [P] [US2] Create `src/components/review/ReviewProgressPips.tsx` — renders N pip indicators (done=sage, active=ink, upcoming=paper-3) per `ReviewProgressPipsProps`
- [ ] T023 [P] [US2] Create `src/components/review/ProjectChoicePicker.tsx` — 3-column grid of choice buttons (suggested one has amber background); each button shows project icon + name; fires `onClassify(projectId, applyToMerchant)`
- [ ] T024 [US2] Create `src/components/review/ReviewCard.tsx` — main review card: merchant header, amount, date/time, AI reasoning context box, suggestion banner (60% احتمالية style), `<ProjectChoicePicker>`, skip + apply-to-merchant buttons; receives `ReviewCardProps` per component-contracts.md
- [ ] T025 [US2] Create `src/components/review/ReviewQueue.tsx` — manages review state: `useQuery(['transactions', 'pending'])`, current index, `useMutation` for classify with optimistic update (removes item from list immediately); passes data to `<ReviewCard>` and `<ReviewProgressPips>`; shows success state when queue is empty
- [ ] T026 [US2] Create `src/app/(shell)/review/page.tsx` — Review page: page header, "تصنيف ذكي للكل" button (calls classify-bulk mutation), `<ReviewQueue>`, "المعاملات القادمة" upcoming list

**Checkpoint**: Review queue fully functional — classifying moves items out, sidebar badge decreases, rules are learned.

---

## Phase 5: User Story 3 — Transaction List & Filtering (Priority: P2)

**Goal**: User browses all transactions with project filters, search, and can click any row to see full details.

**Independent Test**: Navigate to `/transactions` → filter by "عمل" → only work transactions visible; search "كافيه" → only coffee transactions visible; click a row → modal opens with all transaction details including confidence score.

### Implementation for User Story 3

- [ ] T027 [P] [US3] Create `src/components/ui/ConfidenceMeter.tsx` — 5-pip horizontal indicator; score ≥ 0.8 → all pips sage (high), ≥ 0.5 → 3 pips amber (med), < 0.5 → 1 pip rose (low); `size` prop (sm=8px wide pips, md=14px)
- [ ] T028 [P] [US3] Create `src/components/transactions/TransactionFilters.tsx` — horizontal scrollable filter bar with pills: كل (all), شخصي, عمل, فريلانس, دخل, غير مصنّفة; each shows count in parentheses; active pill uses ink background; fires `onFilterChange`
- [ ] T029 [P] [US3] Create `src/components/transactions/TransactionItem.tsx` — single row component: icon, merchant name, time + project tag + notes preview, `<ConfidenceMeter>`, amount (income green); used in both TransactionList and ReviewQueue
- [ ] T030 [US3] Create `src/components/transactions/TransactionDetailModal.tsx` — modal overlay (backdrop blur, Escape to close) with full transaction details: merchant, amount, date, time, payment_last4, project, category, confidence score, ai_reasoning, notes; optional "صنّف" button if status=pending; per component-contracts.md
- [ ] T031 [US3] Create `src/components/transactions/TransactionList.tsx` — transactions grouped by date; renders `<TransactionItem>` rows with date header dividers; infinite scroll via `IntersectionObserver` triggering next page fetch; click handler opens `<TransactionDetailModal>`
- [ ] T032 [US3] Create `src/components/transactions/AddTransactionModal.tsx` — modal form: merchant (text), amount (number, negative=expense/positive=income), date picker, time, payment_last4, project selector, category selector, notes; submits `POST /api/transactions`
- [ ] T033 [US3] Create `src/app/api/transactions/export/route.ts` — `GET` handler: accepts same filter params as list endpoint; builds CSV string with headers (التاريخ, التاجر, المبلغ, المشروع, الفئة, الحالة); returns `Content-Disposition: attachment; filename=maliy-transactions.csv`
- [ ] T034 [US3] Create `src/app/(shell)/transactions/page.tsx` — Transactions page: `useInfiniteQuery` on `/api/transactions`, `<TransactionFilters>` with `useQueryState` for URL-synced filter, search input with 300ms debounce, "📤 تصدير" button triggering CSV export, "+ معاملة جديدة" opening `<AddTransactionModal>`, `<TransactionList>`

**Checkpoint**: Full transactions page with filtering, search, detail modal, add form, and CSV export working.

---

## Phase 6: User Story 4 — Financial Analytics (Priority: P2)

**Goal**: User sees visual spending breakdowns: stat cards, category bars, project donut chart, daily spend bar chart.

**Independent Test**: Navigate to `/analytics` → 4 stat cards visible with real monthly numbers; spending-by-category list rendered in descending order; Recharts PieChart shows project distribution; Recharts BarChart shows daily spend bars.

### Implementation for User Story 4

- [ ] T035 [US4] Create `src/app/api/analytics/route.ts` — `GET` handler with `from`/`to` query params: queries `monthly_summary` view + `transaction_graph` view; computes income, expenses, daily_average, savings_rate, month-over-month comparisons, category breakdown (with `spending_categories` join), project distribution, daily spend array; returns `AnalyticsData` per api-contracts.md
- [ ] T036 [P] [US4] Create `src/components/analytics/StatGrid.tsx` — 4-column responsive grid of `big-stat` cards: total income (sage), expenses (rose), daily average, savings rate; each shows month-over-month arrow indicator
- [ ] T037 [P] [US4] Create `src/components/analytics/CategoryBreakdown.tsx` — list of `CategorySpend` items sorted by amount descending; each row: category icon, name, Tailwind progress bar (`<div style={{width: pct}}>`) colored by category, amount in Fraunces font
- [ ] T038 [P] [US4] Create `src/components/analytics/ProjectDistributionChart.tsx` — Recharts `<PieChart>` with `<Pie innerRadius="55%">` (donut); colors: amber=personal, ink=work, sage=freelance; legend below chart; Arabic labels in tooltips
- [ ] T039 [P] [US4] Create `src/components/analytics/DailySpendChart.tsx` — Recharts `<BarChart>` with daily spend bars; `<ReferenceLine>` for average; `<Tooltip>` showing Arabic date + amount; RTL via reversed data array
- [ ] T040 [US4] Create `src/app/(shell)/analytics/page.tsx` — Analytics page: date range header with "إبريل 2026" selector, `useQuery(['analytics', month])`, renders `<StatGrid>`, 2-col grid with `<CategoryBreakdown>` + `<ProjectDistributionChart>`, full-width `<DailySpendChart>`

**Checkpoint**: Analytics page fully renders with live Recharts visualizations.

---

## Phase 7: User Story 5 — Cash-Flow Forecast (Priority: P2)

**Goal**: User sees 30-day balance scenarios, forecast chart with danger zones, and upcoming financial events.

**Independent Test**: Navigate to `/forecast` → 3 scenario cards (pessimistic/likely/optimistic) with percentages; Recharts ComposedChart renders past balance + forecast curve; danger zone highlighted; upcoming events list shows salary/rent/subscriptions.

### Implementation for User Story 5

- [ ] T041 [US5] Create `src/lib/forecast.ts` — implements `generateForecast(userId, horizonDays)`: (1) fetch last 90 days of classified transactions, (2) compute rolling income/expense averages, (3) detect recurring transactions (same merchant ±3-day cadence), (4) build daily balance projection array, (5) Monte Carlo 100 runs with ±15% noise on non-recurring, (6) extract p15/p50/p85, (7) identify danger zones (days where p15 < 1000 SAR), (8) detect upcoming events; returns `ForecastSnapshot` data
- [ ] T042 [US5] Create `src/app/api/forecast/route.ts` — `GET` handler with `horizon` param (7/30/90): checks `forecast_snapshots` for cached snapshot < 6h old; if stale/missing calls `generateForecast()` and upserts to DB; returns `ForecastSnapshot` per api-contracts.md
- [ ] T043 [P] [US5] Create `src/components/forecast/ForecastScenarios.tsx` — dark ink gradient card with 3 scenario columns: pessimistic (rose), likely (amber-soft), optimistic (sage); each shows amount in Fraunces + probability %
- [ ] T044 [P] [US5] Create `src/components/forecast/ForecastChart.tsx` — Recharts `<ComposedChart>`: `<Area>` for actual past balance (ink), `<Area>` for forecast likely (amber dashed), `<ReferenceArea>` for danger zones (rose translucent), `<ReferenceLine>` at 1000 SAR threshold, horizon tab switcher (7/30/90)
- [ ] T045 [P] [US5] Create `src/components/forecast/UpcomingEvents.tsx` — alert-style list of upcoming financial events; income events (info style), expense events (warn style), danger zones (danger style) with action chips
- [ ] T046 [US5] Create `src/app/(shell)/forecast/page.tsx` — Forecast page: `useQuery(['forecast', horizon])` with tab state for horizon, renders `<ForecastScenarios>`, `<ForecastChart>`, `<UpcomingEvents>`

**Checkpoint**: Forecast page shows probabilistic balance scenarios and upcoming events.

---

## Phase 8: User Story 6 — Debts & Obligations (Priority: P3)

**Goal**: User tracks what they owe and what others owe them, with progress bars and payment recording.

**Independent Test**: Navigate to `/debts` → overview card shows total owed/owed-to-me/net; debt cards with progress bars and due dates render; "+ إضافة دين" opens a form that creates a new debt entry; "سدّد الآن" records a payment and updates remaining amount.

### Implementation for User Story 6

- [ ] T047 [P] [US6] Create `src/app/api/debts/route.ts` — `GET` returns `{ owed_by_me, owed_to_me, summary }` per api-contracts.md; `POST` creates new debt record with validation (remaining ≤ total, direction enum check)
- [ ] T048 [P] [US6] Create `src/app/api/debts/[id]/route.ts` — `PATCH` updates debt fields; `DELETE` removes record
- [ ] T049 [P] [US6] Create `src/app/api/debts/[id]/payment/route.ts` — `POST` records payment: deducts amount from `remaining_amount`, creates a corresponding transaction record (negative amount, project_id=null, merchant=debtor_name, status='classified'), returns updated debt + created transaction
- [ ] T050 [P] [US6] Create `src/components/debts/DebtOverview.tsx` — dark balance-card styled overview showing total owed (rose), owed-to-me (sage), net, monthly repayment rate; uses Fraunces numerals
- [ ] T051 [P] [US6] Create `src/components/debts/DebtCard.tsx` — individual debt card: creditor name, icon, total/remaining, progress bar (urgent=rose/normal=sage gradient), due date row, "سدّد الآن"/"سدّد دفعة" button triggering payment mutation; `is_urgent` flag triggers rose border styling
- [ ] T052 [P] [US6] Create `src/components/debts/AddDebtModal.tsx` — modal form: debtor_name, direction toggle (عليكِ / لكِ), total_amount, remaining_amount (defaults to total), due_date (optional), notes, is_interest_free checkbox; submits `POST /api/debts`
- [ ] T053 [US6] Create `src/app/(shell)/debts/page.tsx` — Debts page: `useQuery(['debts'])`, `<DebtOverview>`, "ديون عليكِ" section with `<DebtCard>` grid, "لكِ على الآخرين" section with tx-item list, "+ إضافة دين" opening `<AddDebtModal>`

**Checkpoint**: Debts page fully functional with create, payment recording, and progress tracking.

---

## Phase 9: User Story 7 — Smart Alerts (Priority: P3)

**Goal**: User views tabbed smart alerts by type; can act on or dismiss each alert.

**Independent Test**: Navigate to `/alerts` → 5 tabs visible with correct counts; clicking "عاجل" tab shows only urgent alerts; clicking "شاهد الخطة" chip navigates to `/forecast`; clicking "تجاهل" removes the alert from the list.

### Implementation for User Story 7

- [ ] T054 [P] [US7] Create `src/app/api/alerts/route.ts` — `GET` returns alerts filtered by `type`/`dismissed` params with tab counts object; auto-generates alerts on each call: check for (1) pending transaction backlog > 3, (2) project budget > 85% utilized, (3) forecast danger zone exists, (4) stale bills (recurring expected but not seen)
- [ ] T055 [P] [US7] Create `src/app/api/alerts/[id]/dismiss/route.ts` — `POST` sets `dismissed=true` for alert; returns updated alert
- [ ] T056 [P] [US7] Create `src/components/alerts/AlertTabs.tsx` — tab bar with 5 buttons (جميع/عاجل/توصيات/تذكيرات/إنجازات) each showing count badge; active tab has ink background; fires `onTabChange`
- [ ] T057 [P] [US7] Create `src/components/alerts/AlertItem.tsx` — alert row: colored left border (danger=rose/warn=amber/info=sage), icon box, title, body, timestamp, optional action chips; chips: primary chip fires `onAction(actionType, payload)`, secondary chip fires `onDismiss`; per component-contracts.md
- [ ] T058 [US7] Create `src/components/alerts/AlertList.tsx` — maps `Alert[]` to `<AlertItem>` components; handles empty state "لا توجد تنبيهات" per tab
- [ ] T059 [US7] Create `src/app/(shell)/alerts/page.tsx` — Alerts page: `useQuery(['alerts', tab])`, `<AlertTabs>`, `<AlertList>`; `onAction` handler: 'navigate' type uses `router.push(payload.route)`, 'confirm' type fires mutation; optimistic dismiss removes from list immediately

**Checkpoint**: Full alerts system with tabs, dismissal, and navigation actions working.

---

## Phase 10: User Story 8 — AI Chat Assistant (Priority: P2)

**Goal**: Arabic AI assistant in the right sidebar responds to financial questions with rich cards and supports voice input.

**Independent Test**: Type "كيف حال ميزانيتي؟" in chat → receive Arabic streaming response within 5 seconds; send a transaction-related question → response includes a tx_receipt rich card with project classification chips; tap microphone → voice input transcribes to Arabic text.

### Implementation for User Story 8

- [ ] T060 [US8] Extend `src/lib/ai.ts` — add `streamChat(userId, messages)` function: builds system prompt with user's current DashboardData context (balance, project budgets, pending count); calls OpenRouter API (`tencent/hy3-preview:free`) with streaming; parses response for `rich_card` JSON blocks; returns `ReadableStream`
- [ ] T061 [US8] Create `src/app/api/chat/messages/route.ts` — `GET` returns last 50 `ChatMessage` records for user, ordered by `created_at ASC`
- [ ] T062 [US8] Create `src/app/api/chat/route.ts` — `POST` handler: (1) saves user message to `chat_messages`, (2) calls `streamChat()`, (3) pipes `ReadableStream` as SSE response with `text/event-stream` Content-Type; saves assistant response to DB after stream completes
- [ ] T063 [P] [US8] Create `src/components/chat/VoiceInput.tsx` — microphone button using `window.SpeechRecognition || window.webkitSpeechRecognition`; `recognition.lang = 'ar-SA'`; pulsing rose animation when recording; fires `onTranscript(text)` on result; renders `null` on unsupported browsers (Firefox guard)
- [ ] T064 [P] [US8] Create `src/components/chat/RichCardRenderer.tsx` — switch on `card.type`: `tx_receipt` renders transaction receipt with project chip buttons; `chips` renders action chip row; each chip fires `onChipAction(action, payload)` from `ChatMessageProps`
- [ ] T065 [P] [US8] Create `src/components/chat/ChatMessage.tsx` — renders user (align-end, ink bubble) or assistant (align-start, paper bubble) message; if message has `rich_card` renders `<RichCardRenderer>` below bubble; timestamp in small text
- [ ] T066 [US8] Create `src/components/chat/ChatComposer.tsx` — composer row: text input (RTL placeholder "اسألني عن أموالك..."), `<VoiceInput>` mic button (rec state = rose pulse), send button (amber background); suggestion chips above composer; fires `onSend(text)`; per component-contracts.md
- [ ] T067 [US8] Update `src/components/layout/ChatPanel.tsx` — replace stub: add `useQuery(['chat-messages'])`, streaming state via `useRef<ReadableStreamDefaultReader>`, message list with auto-scroll to bottom, `<ChatMessage>` rendering, `<ChatComposer>`; `onChipAction` handler for classification chips triggers classify mutation

**Checkpoint**: Full AI chat assistant working — streaming responses, rich cards, voice input all functional.

---

## Phase 11: Remaining Pages & Polish

**Purpose**: Project detail pages, settings, mobile responsiveness, and cross-cutting concerns.

- [ ] T068 [P] Create `src/components/projects/ProjectDetailHero.tsx` — dark ink hero card with project icon, name (Fraunces), 3-col stats grid (spent/remaining/income or similar); used by project detail pages
- [ ] T069 [P] Update `src/app/(shell)/projects/[id]/page.tsx` — replace existing with: `<ProjectDetailHero>`, budget progress bar with percentage, warning card if > 85% utilized, `<TransactionList>` filtered to project; reuses existing project API routes
- [ ] T070 [P] Create `src/app/(shell)/settings/page.tsx` — Settings page: profile card (avatar, name, email, phone form inputs), classification settings card (confidence threshold slider, silent auto-classify toggle), placeholder subscription info; `PATCH /api/settings` (simple local-state for now — no new API route needed)
- [ ] T071 [P] Create `src/components/ui/SilentConfirm.tsx` — inline confirmation strip with undo button; auto-dismisses after 5 seconds via `setTimeout`; used after silent auto-classifications; per component-contracts.md
- [ ] T072 Update `src/app/(shell)/layout.tsx` — add `react-hot-toast` `<Toaster position="bottom-center" />` for Arabic toast notifications; configure RTL direction for toast container
- [ ] T073 Audit all layout components for RTL Tailwind compliance: replace any `pl-`/`pr-`/`ml-`/`mr-`/`text-left`/`text-right` with logical equivalents (`ps-`, `pe-`, `ms-`, `me-`, `text-start`, `text-end`); test at 1280px, 1024px, 640px, 375px breakpoints
- [ ] T074 Update `src/components/layout/Sidebar.tsx` — wire up live pending count badge on "تنتظر تصنيفك" nav item from `useQuery(['transactions', 'pending-count'])` hitting `GET /api/transactions?status=pending&limit=1`; wire up auto-classification accuracy percentage from dashboard query

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately. T001–T005 all parallelizable.
- **Phase 2 (Foundational)**: Depends on Phase 1 completion. T006–T011 mostly parallelizable; T007 must complete before T008/T009/T011.
- **Phase 3 (US1 Dashboard)**: Depends on Phase 2 (T006 migration, T007 shell layout). FIRST user story — MVP deliverable.
- **Phase 4 (US2 Review)**: Depends on Phase 2 + T019 (transactions API). Classification pipeline (T010) from Phase 2 is prerequisite.
- **Phase 5 (US3 Transactions)**: Depends on Phase 2 + T019 (shared transactions API).
- **Phase 6 (US4 Analytics)**: Depends on Phase 2 (T006 monthly_summary view).
- **Phase 7 (US5 Forecast)**: Depends on Phase 2 (T006 forecast_snapshots table, T010 classification for accurate data).
- **Phase 8 (US6 Debts)**: Depends on Phase 2 only — fully independent.
- **Phase 9 (US7 Alerts)**: Depends on Phase 2 + Phase 7 (forecast for danger zone alerts).
- **Phase 10 (US8 Chat)**: Depends on Phase 2 + Phase 3 (dashboard context in AI prompt).
- **Phase 11 (Polish)**: Depends on all user story phases.

### User Story Dependencies

- **US1 Dashboard (P1)**: After Phase 2 → **MVP deliverable**
- **US2 Review (P1)**: After Phase 2 + US1 API (T019)
- **US3 Transactions (P2)**: After Phase 2 + T019 — shares API with US2
- **US4 Analytics (P2)**: After Phase 2 — independent
- **US5 Forecast (P2)**: After Phase 2 — independent
- **US6 Debts (P3)**: After Phase 2 — independent
- **US7 Alerts (P3)**: After Phase 2 + US5 (forecast danger zones)
- **US8 Chat (P2)**: After Phase 2 + US1 (dashboard context)

### Within Each User Story

- API routes before page components (components depend on data shape)
- Leaf components before container components
- Container components before page files
- All [P] tasks within a phase can run concurrently

---

## Parallel Execution Examples

### Phase 2 Parallel Opportunities

```
T006 (DB migration)        — runs alone first, unblocks all others
T008 Sidebar               — after T006
T009 TopBar                — after T006 (parallel with T008)
T010 Classification lib    — after T006 (parallel with T008, T009)
T011 ChatPanel stub        — parallel with T008, T009, T010
```

### Phase 3 (US1) Parallel Opportunities

```
T012 Dashboard API         — first
T013 BalanceCard           — parallel with T014, T015, T017
T014 ReviewBanner          — parallel with T013, T015, T017
T015 ProjectSummaryCards   — parallel with T013, T014, T017
T017 AlertsPreview         — parallel with T013, T014, T015
T016 CashFlowChart         — after T012 (needs data shape)
T018 Dashboard page        — after T012–T017 complete
```

### Phase 4 (US2) Parallel Opportunities

```
T019 Transactions API      — first
T020 Classify API          — after T019
T021 Bulk Classify API     — after T019 (parallel with T020)
T022 ReviewProgressPips    — parallel with T023, T024
T023 ProjectChoicePicker   — parallel with T022, T024
T024 ReviewCard            — after T022, T023
T025 ReviewQueue           — after T020, T021, T024
T026 Review page           — after T025
```

---

## Implementation Strategy

### MVP First (US1 + US2 — both P1)

1. Complete Phase 1: Setup (T001–T005)
2. Complete Phase 2: Foundational (T006–T011)
3. Complete Phase 3: Dashboard — US1 (T012–T018)
4. **VALIDATE**: Dashboard renders with live data, review banner visible
5. Complete Phase 4: Review — US2 (T019–T026)
6. **VALIDATE**: Full classification flow works end-to-end
7. **DEPLOY MVP** — core value proposition delivered

### Incremental Delivery After MVP

- **Sprint 2**: US3 (Transactions) + US4 (Analytics) + US8 (Chat)
- **Sprint 3**: US5 (Forecast) + US7 (Alerts)
- **Sprint 4**: US6 (Debts) + Phase 11 (Polish)

### Parallel Team Strategy

After Phase 2 is complete:
- Developer A: US1 (Dashboard) → US2 (Review)
- Developer B: US3 (Transactions) → US4 (Analytics)
- Developer C: US5 (Forecast) → US7 (Alerts)
- Developer D: US8 (Chat) → US6 (Debts)

---

## Notes

- `[P]` tasks = different files, no shared-state dependencies within the phase
- `[USN]` maps each task to its user story for traceability
- All Supabase queries must include `user_id = auth.uid()` (enforced by RLS but also explicit in queries)
- Chart.js is NOT used anywhere — Recharts only (constitution mandate)
- All Arabic text must be hardcoded in Arabic; no translation function needed (single language)
- Arabic number formatting: `Intl.NumberFormat('ar-SA')` for amounts displayed to users
- RTL: use Tailwind logical property utilities throughout (`ps-`, `pe-`, `ms-`, `me-`, `border-s-`, `text-start`)
- Commit after each phase checkpoint
- Stop at Phase 3 checkpoint to demo Dashboard to user before continuing
