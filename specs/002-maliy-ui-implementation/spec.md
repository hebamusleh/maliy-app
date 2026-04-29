# Feature Specification: ماليّ Full UI Implementation & Backend Integration

**Feature Branch**: `002-maliy-ui-implementation`
**Created**: 2026-04-29
**Status**: Draft
**Input**: User description: "look to prototype.html and update ui, implement functionality and BE if exist"

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Dashboard Overview (Priority: P1)

As a user of ماليّ, I want to see my complete financial overview on the dashboard so I can understand my financial status at a glance.

**Why this priority**: The dashboard is the first screen users see and ties together balance, projects, cash-flow forecast, and smart alerts — all core to the product's value proposition.

**Independent Test**: Can be fully tested by navigating to the dashboard and verifying: net balance card with income/expense/savings stats, project summary cards with budget progress, a 30-day cash-flow chart, and a list of smart alerts.

**Acceptance Scenarios**:

1. **Given** a logged-in user with transaction history, **When** they open the dashboard, **Then** they see net balance, income, expenses, savings, and a count of pending-classification transactions.
2. **Given** pending-classification transactions exist, **When** the dashboard loads, **Then** a prominent review banner appears with the exact count and a "Start Review" call-to-action.
3. **Given** the balance card is visible, **When** the user views it, **Then** it shows the current-month net balance with a percentage change vs. the previous month.
4. **Given** a user has multiple projects, **When** the dashboard loads, **Then** each project card shows its name, spend amount, budget utilization percentage, and remaining budget.

---

### User Story 2 - Transaction Classification Review (Priority: P1)

As a user, I want to quickly classify transactions the system could not auto-classify so I can keep my projects accurate and teach the AI my preferences.

**Why this priority**: This is the core AI interaction flow. User confirmations improve the auto-classification model and keep project budgets accurate.

**Independent Test**: Can be fully tested by navigating to the Review page, viewing a single unclassified transaction with AI context and suggestion, selecting a project category, and confirming; verifying the transaction moves out of the pending queue.

**Acceptance Scenarios**:

1. **Given** unclassified transactions exist, **When** the user opens the Review page, **Then** each transaction is shown one at a time with: merchant name, amount, date, payment source, AI reasoning context, and a confidence-weighted suggestion.
2. **Given** the user selects a project category for a transaction, **When** they confirm, **Then** the transaction is classified under that project, the pending count decreases by one, and the system silently records the user's choice for future learning.
3. **Given** the user clicks "Apply to all [merchant] transactions", **When** confirmed, **Then** all existing unclassified transactions from the same merchant are classified with the selected project.
4. **Given** the user clicks "Skip", **When** on the current transaction, **Then** it moves to the end of the queue without being classified.
5. **Given** the user clicks "Smart Classify All", **When** confirmed, **Then** the system applies its best-guess classification to all pending transactions using the current learned model, showing a summary of what was classified.

---

### User Story 3 - Transaction List & Filtering (Priority: P2)

As a user, I want to browse all my transactions with filtering and search so I can find specific entries and verify classification accuracy.

**Why this priority**: Transactions are the raw data of the system; filtering and search enable auditability and trust.

**Independent Test**: Can be fully tested by opening the Transactions page, applying a project filter, and confirming only that project's transactions appear. Clicking a transaction row opens a detail modal.

**Acceptance Scenarios**:

1. **Given** the Transactions page is open, **When** the user selects a project filter (e.g., "Work"), **Then** only transactions classified under that project are shown.
2. **Given** a transaction row is clicked, **When** a detail modal opens, **Then** it shows full details: merchant, amount, date, time, payment method last-4, project category, AI confidence score, and notes.
3. **Given** the search bar is used, **When** a user types a merchant name or amount, **Then** the transaction list filters in real-time to matching rows.
4. **Given** the "Unclassified · N" filter is selected, **When** active, **Then** only transactions pending classification are shown, with a link to the Review queue.
5. **Given** the "Export" button is clicked, **When** a project/date filter is active, **Then** a CSV download is triggered for the filtered transactions.

---

### User Story 4 - Financial Analytics (Priority: P2)

As a user, I want visual analytics of my spending patterns so I can understand where my money goes and identify areas for improvement.

**Why this priority**: Analytics provide actionable insight — the "why" behind the balance number.

**Independent Test**: Can be fully tested by opening the Analytics page and verifying: 4 stat cards (income, expenses, daily average, savings rate), a spending-by-category list with bar indicators, a project distribution donut chart, and a daily spending bar chart.

**Acceptance Scenarios**:

1. **Given** the Analytics page is open, **When** viewing the current month, **Then** four summary stats are displayed: total income, total expenses, daily average, and savings rate, each with a month-over-month comparison.
2. **Given** the category breakdown is visible, **When** viewing spending by category, **Then** categories are listed in descending spend order with visual bar indicators proportional to spend.
3. **Given** the project distribution chart is visible, **When** viewing it, **Then** a donut chart shows what percentage of total spending belongs to each project.
4. **Given** the daily spending chart is visible, **When** viewing it, **Then** a bar chart shows spend per day for the selected month, with highest and lowest spend days annotated.

---

### User Story 5 - Cash-Flow Forecast (Priority: P2)

As a user, I want to see an AI-generated forecast of my financial position in the next 7, 30, and 90 days so I can proactively manage upcoming obligations.

**Why this priority**: Forecast and early-warning capabilities are key differentiators; they prevent financial crises.

**Independent Test**: Can be fully tested by opening the Forecast page, verifying three end-of-period scenarios (pessimistic/likely/optimistic) with probability percentages, and a list of upcoming financial events with dates and amounts.

**Acceptance Scenarios**:

1. **Given** the Forecast page is open, **When** viewing the 30-day forecast, **Then** three balance scenarios (low/most-likely/high) are shown with probability percentages.
2. **Given** upcoming financial events exist (salary, rent, subscriptions), **When** viewing the forecast, **Then** each event appears in a timeline list with its expected date, amount direction, and days-until.
3. **Given** a "danger zone" is predicted, **When** the forecast shows balance dropping below a threshold, **Then** a danger alert is highlighted with specific dates and actionable advice (e.g., delay subscriptions).
4. **Given** the user switches the time horizon (7 / 30 / 90 days), **When** selecting a tab, **Then** the chart and scenarios update to reflect the selected period.

---

### User Story 6 - Debts & Obligations (Priority: P3)

As a user, I want to track what I owe others and what others owe me so I can manage my net financial obligations.

**Why this priority**: Debt tracking is a core financial health feature; without it, the balance picture is incomplete.

**Independent Test**: Can be fully tested by opening the Debts page, verifying: total debt summary card, individual debt cards with progress bars and due dates, and a list of amounts owed by others.

**Acceptance Scenarios**:

1. **Given** the Debts page is open, **When** viewing it, **Then** an overview shows total owed, total owed-to-me, net obligation, and monthly repayment rate.
2. **Given** a debt card is visible, **When** viewing it, **Then** it shows: creditor name, total amount, amount remaining, repayment progress bar, next due date, and urgency state (urgent/normal).
3. **Given** the user clicks "Pay Now" on a debt, **When** a payment amount is entered and confirmed, **Then** the debt's remaining balance decreases and a transaction is recorded.
4. **Given** the user clicks "+ Add Debt", **When** the form is submitted, **Then** a new debt entry appears in the appropriate section (owed by me / owed to me).

---

### User Story 7 - Smart Alerts (Priority: P3)

As a user, I want actionable smart alerts categorized by type so I can act on urgent financial events and recommendations.

**Why this priority**: Alerts are the proactive intelligence layer; they surface insights the user might otherwise miss.

**Independent Test**: Can be fully tested by opening the Alerts page, verifying tabs (All/Urgent/Recommendations/Reminders/Achievements), and checking that each alert has a contextual explanation, timestamp, and one or more action buttons.

**Acceptance Scenarios**:

1. **Given** the Alerts page is open, **When** viewing it, **Then** alerts are tabbed by type with counts per tab.
2. **Given** an alert has associated actions, **When** clicking an action button, **Then** the user is navigated to the relevant section (e.g., Review page, Forecast page) or a confirmation dialog appears.
3. **Given** a user dismisses an alert, **When** they click "Ignore" or "No thanks", **Then** the alert is removed from the list and its count decreases.

---

### User Story 8 - AI Chat Assistant (Priority: P2)

As a user, I want to chat with an AI financial assistant in Arabic so I can ask questions about my finances, classify transactions via conversation, and receive personalized insights.

**Why this priority**: The chat is the natural-language interface that makes the app accessible and personable, and enables conversational transaction management.

**Independent Test**: Can be fully tested by typing a financial question in the chat input, sending it, and receiving a contextually relevant Arabic response with optional rich cards (transaction receipts, charts, chips).

**Acceptance Scenarios**:

1. **Given** the chat sidebar is visible, **When** the user types a message and sends it, **Then** an AI response appears within the conversation, contextually relevant to the user's financial data.
2. **Given** the AI detects a transaction in the user's message, **When** responding, **Then** the AI presents a transaction receipt card with classification options as quick-action chips.
3. **Given** the user sends a voice message (microphone button), **When** voice recording is complete, **Then** the audio is transcribed to text and processed as a regular message.
4. **Given** the AI recommends an action (e.g., budget adjustment), **When** the user confirms via a chip, **Then** the corresponding change is applied to their data.

---

### Edge Cases

- What happens when a transaction cannot be parsed (no merchant name, zero amount)? → Show with "غير معروف" and flag for manual review.
- How does the system handle transactions from multiple bank accounts linked to the same project? → Aggregate all by project regardless of account source.
- What if a user runs out of pending transactions to review? → Show a success state "أنجزتِ كل التصنيفات!" with a summary of what was classified.
- What if the forecast cannot compute (insufficient history, < 30 days of data)? → Show a friendly message explaining more data is needed and display what's available.
- What if chart.js fails to load or canvas is not supported? → Fall back to a text-based summary of the same data.
- What happens if an AI chat request fails? → Show a graceful error bubble in the chat with a retry option.

---

## Requirements *(mandatory)*

### Functional Requirements

**Dashboard**

- **FR-001**: System MUST display the current-month net balance with income, expense, savings, and pending-transaction count on the dashboard.
- **FR-002**: System MUST show a review banner when there are unclassified transactions, with the exact count.
- **FR-003**: System MUST render a cash-flow forecast chart on the dashboard supporting 7, 30, and 90-day views.
- **FR-004**: System MUST display project summary cards with name, spend, budget utilization percentage, and remaining budget.
- **FR-005**: System MUST surface up to 2 most-critical smart alerts on the dashboard.

**Transactions**

- **FR-006**: System MUST list all transactions grouped by date, showing merchant, time, project tag, confidence indicator, and amount.
- **FR-007**: System MUST support filtering transactions by project (شخصي / عمل / فريلانس / دخل / غير مصنّفة).
- **FR-008**: System MUST support real-time search by merchant name or amount.
- **FR-009**: System MUST open a detail modal when a transaction row is clicked, showing all fields including confidence score and notes.
- **FR-010**: System MUST allow manual addition of a new transaction via a form modal.
- **FR-011**: System MUST allow CSV export of the current filtered transaction set.

**Classification Review**

- **FR-012**: System MUST present unclassified transactions one at a time in the Review queue, with AI reasoning context and a confidence-weighted suggestion.
- **FR-013**: System MUST record every user classification choice to improve future auto-classification accuracy.
- **FR-014**: System MUST allow bulk-apply of a classification to all transactions from the same merchant.
- **FR-015**: System MUST support a "Smart Classify All" action that applies model-best guesses to all pending items.

**Analytics**

- **FR-016**: System MUST render spending-by-category bars, project distribution donut chart, and daily spending bar chart on the Analytics page.
- **FR-017**: System MUST display month-over-month comparison stats for income, expenses, daily average, and savings rate.

**Forecast**

- **FR-018**: System MUST compute and display three end-of-period balance scenarios (pessimistic/most-likely/optimistic) with probability labels.
- **FR-019**: System MUST list upcoming financial events (salary dates, recurring bills, subscriptions) with amounts and days-until.
- **FR-020**: System MUST highlight danger zones where the balance is predicted to drop below a configurable threshold.

**Debts**

- **FR-021**: System MUST allow users to create, update, and delete debt records (both owed-by-me and owed-to-me).
- **FR-022**: System MUST display repayment progress bars and next-due-date urgency indicators per debt.
- **FR-023**: System MUST allow recording a payment against a debt, reducing its remaining balance.

**Alerts**

- **FR-024**: System MUST generate and persist smart alerts of types: Urgent, Recommendation, Reminder, and Achievement.
- **FR-025**: System MUST allow users to dismiss or act on each alert.
- **FR-026**: System MUST tab-filter alerts by type with live counts.

**AI Chat**

- **FR-027**: System MUST support sending and receiving Arabic-language chat messages to an AI assistant with access to the user's financial context.
- **FR-028**: System MUST render rich response cards (transaction receipts, quick-chip actions) within chat messages.
- **FR-029**: System MUST support voice input via microphone, transcribing audio to text before sending.

**UI / Navigation**

- **FR-030**: System MUST implement the full sidebar navigation (Dashboard, Transactions, Review, Analytics, Forecast, Debts, Alerts, project detail pages, Settings) with active state.
- **FR-031**: System MUST implement a global search bar in the top bar that searches across transactions.
- **FR-032**: System MUST render the learning-accuracy card in the sidebar showing current auto-classification accuracy and weekly improvement.
- **FR-033**: System MUST use the design tokens defined in the prototype (color palette, typography: Reem Kufi / Noto Naskh Arabic / Fraunces) throughout all pages.
- **FR-034**: All UI text MUST be in Arabic with RTL layout direction.

**Backend**

- **FR-035**: System MUST persist transactions, classification decisions, debts, alerts, and user settings in the existing Supabase database.
- **FR-036**: System MUST provide REST API endpoints for all CRUD operations on transactions, debts, and alerts.
- **FR-037**: System MUST expose an analytics aggregation endpoint that computes balance, income, expenses, and category breakdowns for a given period.
- **FR-038**: System MUST expose a forecast endpoint that returns predicted cash-flow scenarios for 7/30/90-day horizons.

### Key Entities

- **Transaction**: ID, user_id, merchant_name, amount (positive=income / negative=expense), date, time, payment_method_last4, project_id (nullable), confidence_score (0–1), ai_reasoning, status (classified/pending/skipped), created_at.
- **Project**: ID, user_id, name, type (personal/work/freelance), icon, budget_limit, color, created_at. *(Already exists in 001-project-system)*
- **ClassificationRule**: ID, user_id, merchant_pattern, project_id, created_at — merchant-level learned rules.
- **Debt**: ID, user_id, debtor_name, direction (owed_by_me / owed_to_me), total_amount, remaining_amount, due_date (nullable), notes, urgency (urgent/normal), created_at.
- **Alert**: ID, user_id, type (urgent/recommendation/reminder/achievement), title, body, action_type, action_payload, dismissed, created_at.
- **ChatMessage**: ID, user_id, role (user/assistant), content, rich_card (JSON, nullable), created_at.
- **ForecastSnapshot**: ID, user_id, horizon_days, pessimistic, likely, optimistic, generated_at.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can navigate between all 10+ pages without a full page reload, with transitions completing in under 300ms.
- **SC-002**: The dashboard, transactions, and analytics pages fully render within 1.5 seconds on a standard broadband connection.
- **SC-003**: The classification review flow allows users to process 4 pending transactions in under 30 seconds (7.5 seconds per transaction on average).
- **SC-004**: At least 90% of all UI text is correctly rendered in Arabic RTL without layout breaks on screen widths from 375px to 1920px.
- **SC-005**: The auto-classification accuracy metric displayed in the sidebar increases after each user-confirmed classification session (verifiable by checking the metric before/after a review session).
- **SC-006**: All API endpoints respond within 500ms for datasets up to 1,000 transactions per user.
- **SC-007**: CSV export produces a valid file within 3 seconds for up to 500 transactions.
- **SC-008**: AI chat produces a response within 5 seconds of message submission under normal network conditions.
- **SC-009**: Zero critical accessibility errors (missing ARIA labels on interactive elements, missing language attributes) as measured by automated tooling.
- **SC-010**: The forecast page correctly identifies and highlights a simulated danger zone in a test account scenario where balance is predicted to drop below 1,000 SAR.

---

## Assumptions

- The existing Supabase database and project schema from `001-project-system` will be extended (not replaced) to add new tables for transactions, debts, alerts, and chat messages.
- The existing Next.js app structure (`src/app`, `src/components`, `src/lib`) is the target codebase; no framework migration is needed.
- Authentication is handled by Supabase Auth and the existing session management — no new auth system is required.
- The AI chat feature will use the existing `src/lib/ai.ts` integration; the specific AI model and API key are already configured.
- The Chart.js library will be imported as an npm package rather than via CDN to align with the Next.js build pipeline.
- Arabic fonts (Reem Kufi, Noto Naskh Arabic, Fraunces) will be loaded via Next.js `next/font` or Google Fonts in the layout, not via raw `<link>` tags.
- The prototype's static data (e.g., "سارة المنصور", hardcoded amounts) will be replaced with dynamic data from Supabase for all pages.
- Mobile responsiveness follows the breakpoints defined in the prototype: 1280px, 1024px, and 640px.
- The voice input feature (microphone) is scoped to browsers supporting the Web Speech API; fallback is text-only input on unsupported browsers.
- The "Apply to all [merchant]" classification rule is merchant-name-exact-match in v1; fuzzy matching is out of scope.
