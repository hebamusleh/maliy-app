# Feature Specification: AI Conversational Chat Interface

**Feature Branch**: `004-ai-chat-interface`
**Created**: 2026-04-30
**Status**: Draft
**Input**: User description: "Build the conversational chat interface as the primary UI of ماليّ."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Log Transaction via Text (Priority: P1) 🎯 MVP

A user types a natural-language description of a financial event — for example "دفعت 50 ريال في الكافيه" — into the chat panel. The AI parses the message and responds with a receipt card that shows the extracted amount, auto-classified category, suggested project tag, and a confidence score. The user reviews the card and taps Confirm to save the transaction, or Edit to correct a field, or Delete to discard it.

**Why this priority**: This is the core value proposition of ماليّ — frictionless transaction entry. Every other feature depends on transactions being logged.

**Independent Test**: Open the app. Type "دفعت 120 ريال غداء" into the chat input. Press Send. Verify that an AI receipt card appears showing amount 120 SAR, a food/dining category, a project tag suggestion, and a confidence score. Tap Confirm. Navigate to the transactions list and verify the transaction appears.

**Acceptance Scenarios**:

1. **Given** the chat panel is open, **When** the user types "دفعت 50 ريال كافيه" and sends it, **Then** the AI replies with a receipt card showing amount = 50 SAR, category = مشروبات or مطاعم, project suggestion, and confidence ≥ 0%.
2. **Given** a receipt card is displayed, **When** the user taps Confirm, **Then** the transaction is saved and the card shows a "تم الحفظ" confirmation state.
3. **Given** a receipt card is displayed, **When** the user taps Edit, **Then** the card fields become editable inline; saving applies the edits and saves the transaction.
4. **Given** a receipt card is displayed, **When** the user taps Delete, **Then** the card is dismissed with no transaction saved.
5. **Given** a receipt card is displayed, **When** the user sends a follow-up message without acting on the card, **Then** the card remains visible in the history and can still be acted on.

---

### User Story 2 — Log Transaction via Voice (Priority: P2)

A user taps the microphone button in the chat input area. The button animates to show it is recording. The user speaks a transaction description in Arabic. When the user stops (or taps the button again to finish), the spoken input is transcribed and submitted to the AI exactly as if the user had typed it. An AI receipt card appears with the same fields as in US1.

**Why this priority**: Voice input dramatically reduces friction for mobile and hands-free usage, which is a key differentiator for the app.

**Independent Test**: Tap the microphone button — verify a recording animation appears. Speak "استلمت راتبي 8000 ريال". Stop recording. Verify the transcribed text appears in the chat and an AI receipt card is shown with amount 8000 SAR and an income category.

**Acceptance Scenarios**:

1. **Given** the user is on the chat panel, **When** they tap the microphone button, **Then** a visual recording animation plays and the mic button changes state to indicate recording is active.
2. **Given** the user is recording, **When** they finish speaking and stop the recording, **Then** the spoken words are transcribed into the chat input and automatically submitted.
3. **Given** transcription fails or the browser does not support voice input, **When** the user taps the mic button, **Then** a clear Arabic error message is shown and the user can still type manually.

---

### User Story 3 — Proactive AI Insights (Priority: P3)

The AI proactively sends insight messages in the chat without the user asking. These messages highlight spending patterns, anomalies, or actionable suggestions — for example: "هذه المرة الثالثة هذا الأسبوع التي تدفع فيها في كافيه لاجتماعات عمل — المجموع 312 ريال. هل تريد نقلها لمشروع العمل؟" The user can act on the suggestion directly from the insight message.

**Why this priority**: Proactive insights transform the app from a passive ledger into a financial advisor, driving engagement and user trust.

**Independent Test**: Seed the database with 3+ transactions at the same merchant in the same week. Open the chat. Verify that the AI has already sent an insight message referencing the pattern. Tap the suggested action and verify it is applied.

**Acceptance Scenarios**:

1. **Given** a spending pattern is detected (e.g., repeated vendor, high spend in category), **When** the user opens the chat, **Then** the AI has already placed an insight message in the conversation without the user prompting.
2. **Given** an insight message includes a suggested action, **When** the user taps the action, **Then** the action is executed (e.g., project reassignment or category update) and confirmed in the chat.
3. **Given** no significant patterns exist in the user's data, **When** the user opens chat, **Then** no spurious insight messages are shown.

---

### User Story 4 — Ask Financial Questions (Priority: P4)

A user types any financial question about their own data — such as "كم صرفت هذا الشهر؟" or "ما أكثر فئة صرفت فيها؟" — and the AI answers with specific numbers drawn from the user's transaction history.

**Why this priority**: Conversational querying removes the need to navigate reports or dashboards for common financial questions.

**Independent Test**: With seeded transaction data, type "ما مجموع مصاريفي هذا الشهر؟" in the chat. Verify the AI responds with the correct total for the current month matching the seeded data.

**Acceptance Scenarios**:

1. **Given** the user has transaction data, **When** they ask "كم صرفت هذا الشهر؟", **Then** the AI replies with the correct numeric total for the current calendar month in SAR.
2. **Given** the user asks about a specific project or category, **When** the AI responds, **Then** the answer is scoped to that project or category only.
3. **Given** the user asks a question with no relevant data (e.g., future month), **When** the AI responds, **Then** it clearly states no data is available rather than returning zero or fabricating an answer.

---

### User Story 5 — Suggestion Pills & Quick Actions (Priority: P5)

Suggestion pills appear above the chat input as tappable shortcuts. Tapping a pill ("تقرير أسبوعي", "ربط بطاقة", "تحديد هدف ادخار", "جدولة فاتورة") pre-fills or sends the relevant prompt to the AI, which then guides the user through that flow conversationally.

**Why this priority**: Pills lower the learning curve by surfacing common actions without the user needing to know what to type.

**Independent Test**: Look at the chat input area and verify at least 4 suggestion pills are displayed. Tap "تقرير أسبوعي". Verify the AI responds with a summary of the current week's transactions.

**Acceptance Scenarios**:

1. **Given** the chat panel is visible, **When** the user views the input area, **Then** at least 4 suggestion pills are visible: "تقرير أسبوعي", "ربط بطاقة", "تحديد هدف ادخار", "جدولة فاتورة".
2. **Given** the user taps a suggestion pill, **When** the AI responds, **Then** the response is contextually relevant to that suggestion.
3. **Given** a pill is tapped, **When** the AI requires additional input to complete the action, **Then** it asks a follow-up question in the chat rather than failing silently.

---

### Edge Cases

- What happens when the AI cannot parse a transaction from the user's text (e.g., "مرحبا")?  → AI responds asking for clarification; no receipt card is shown.
- What happens if voice transcription returns an empty string? → The submission is ignored and the mic button resets.
- What happens when the user sends multiple transaction messages in quick succession before confirming any receipt cards? → Each message generates its own receipt card; all cards remain independently actionable in the history.
- What happens if the AI response is delayed? → A typing indicator (three dots) is shown in the chat until the response arrives.
- What happens to session history when the user refreshes the page? → Session history is lost on refresh (per-session, not persisted to a database).
- What happens when the chat panel is opened on a narrow screen (< 768px)? → The panel takes full width and the main content area is hidden.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The chat panel MUST always be visible on the right side of the shell layout, 380px wide, spanning the full viewport height.
- **FR-002**: Users MUST be able to send a text message from the chat input field by pressing Enter or tapping a Send button.
- **FR-003**: The AI MUST respond to every user transaction message with a structured receipt card containing: amount, category, project tag, and confidence score.
- **FR-004**: Each AI receipt card MUST display three action chips: Confirm, Edit, and Delete.
- **FR-005**: Tapping Confirm on a receipt card MUST create a transaction record in the user's financial data using the card's values.
- **FR-006**: Tapping Edit on a receipt card MUST make the card's fields editable inline; saving MUST update the transaction record.
- **FR-007**: Tapping Delete on a receipt card MUST dismiss the card with no transaction created.
- **FR-008**: A microphone button MUST be present in the chat input area; tapping it MUST activate voice recording with a visible animation.
- **FR-009**: Voice input MUST be transcribed and submitted to the AI as if typed by the user.
- **FR-010**: The AI MUST proactively send insight messages into the chat when it detects spending patterns (e.g., repeated vendor, category over-budget, recurring amounts).
- **FR-011**: Proactive insight messages that suggest an action (e.g., "reassign to project") MUST include a tappable button to execute that action.
- **FR-012**: Suggestion pills MUST be displayed persistently above the chat input: "تقرير أسبوعي", "ربط بطاقة", "تحديد هدف ادخار", "جدولة فاتورة".
- **FR-013**: Tapping a suggestion pill MUST trigger the corresponding AI-guided flow in the chat.
- **FR-014**: Message history (both user messages and AI responses) MUST persist for the duration of the browser session.
- **FR-015**: The AI MUST answer direct financial questions using the user's actual transaction data.
- **FR-016**: A typing indicator MUST appear in the chat while the AI is generating a response.
- **FR-017**: On screens narrower than 768px, the chat panel MUST expand to full width and the main content area MUST be hidden.

### Key Entities

- **ChatMessage**: Unique ID, sender type (user or AI), content (text or structured receipt card), timestamp, optional action chips.
- **ReceiptCard**: Pending amount (numeric), category (text), project tag (reference to a project), confidence score (0–100%), status (pending / confirmed / edited / deleted).
- **SuggestionPill**: Label text, action identifier used to generate the pre-canned AI prompt.
- **InsightMessage**: AI-generated text, optional embedded action button, pattern reference (e.g., merchant name, category, date range).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can log a transaction from text input to a confirmed receipt in under 30 seconds.
- **SC-002**: Voice input successfully captures and submits Arabic speech in at least 90% of attempts under normal conditions.
- **SC-003**: Every AI receipt card displays all four required fields (amount, category, project tag, confidence score).
- **SC-004**: Proactive insight messages appear in the chat within one session of the triggering spending pattern being detected.
- **SC-005**: The AI correctly answers common financial questions (current month spend, top category, per-project total) with data matching the user's records.
- **SC-006**: The chat panel loads and is interactive within 2 seconds of the page opening.
- **SC-007**: Message history remains intact and scrollable throughout the session without any messages being lost.

---

## Assumptions

- The chat panel is added to the right side of the existing shell layout; the main content area shrinks to accommodate it.
- Voice transcription relies on the browser's built-in Web Speech API, which supports Arabic. If unavailable, the mic button is hidden rather than shown as broken.
- AI responses are generated by the existing `/api/chat` endpoint; this spec does not change the AI model or its prompt engineering.
- Proactive insights are triggered on page load / chat open by calling a dedicated insights API that checks recent transaction patterns.
- Session history is stored in browser memory only (not persisted to the database); refreshing the page clears the chat history.
- Suggestion pill labels are static (fixed set of 4) for v1; dynamic pill generation based on context is out of scope.
- The Confirm action on a receipt card submits a transaction via the existing `POST /api/transactions` endpoint.
- All UI text is in Arabic and the layout is RTL-first.
- The feature is desktop-first; mobile layout (full-width chat) is supported but not the primary design target.
- No authentication changes are needed; the feature uses the existing no-auth `anon-user` fallback.
