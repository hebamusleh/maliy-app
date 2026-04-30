# Quickstart: AI Conversational Chat Interface

**Branch**: `004-ai-chat-interface` | **Date**: 2026-04-30

---

## Prerequisites

1. App running locally: `npm run dev`
2. Supabase connected (`.env.local` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`)
3. Optional: `OPENROUTER_API_KEY` in `.env.local` — without it, a canned fallback response is returned

---

## End-to-End Test Scenarios

### Scenario 1 — Log a Transaction via Text

1. Open `http://localhost:3000` — verify the **3-column layout**: sidebar (right) | content (centre) | chat panel (left in RTL)
2. In the chat input, type: `دفعت 80 ريال كافيه`
3. Press Enter or tap the send button
4. **Expected**: A receipt card appears in the chat with:
   - Merchant: "كافيه" (or detected name)
   - Amount: −80 SAR (red)
   - Category: "مشروبات" or similar
   - Confidence score (e.g., 82%)
   - Project suggestion buttons
   - Three action chips: **تأكيد** / **تعديل** / **حذف**
5. Tap **تأكيد** → card shows "تم الحفظ ✓"
6. Navigate to Transactions page → verify the 80 SAR transaction appears

### Scenario 2 — Voice Input

1. In the chat panel, locate the microphone button next to the text input
2. Tap it → amber pulsing ring animation starts; button changes to active state
3. Speak: "استلمت راتبي ثمانية آلاف ريال"
4. Stop speaking (or tap mic again)
5. **Expected**: Transcription appears in chat input; message is auto-submitted
6. **Expected**: Receipt card shows income = +8000 SAR, category = "راتب" or "دخل"
7. **If Web Speech API unsupported**: Mic button is hidden entirely; no error state is visible

### Scenario 3 — Confirm / Edit / Delete Actions

1. Log a transaction: `صرفت 200 ريال سوبرماركت`
2. **Edit**: Tap تعديل → merchant and amount fields become editable inline → change amount to 180 → save → card updates and confirms
3. **Delete**: Log another transaction → tap حذف → card shows "تم الإلغاء" → transaction does NOT appear in Transactions page

### Scenario 4 — Proactive Insights

1. Run `POST /api/seed` to insert seed data (3 projects, 6–8 transactions each)
2. Refresh the app
3. **Expected**: Within 2–3 seconds of the chat panel loading, an AI insight message appears (unprompted) such as "دفعتَ في نفس المحل 3 مرات هذا الأسبوع..."
4. Tap the action button on the insight → verify the suggested action is applied

### Scenario 5 — Suggestion Pills

1. View the chat panel input area
2. **Expected**: Four pill buttons visible: "تقرير أسبوعي" | "ربط بطاقة" | "تحديد هدف ادخار" | "جدولة فاتورة"
3. Tap "تقرير أسبوعي" → AI responds with a summary of this week's transactions
4. Tap "ربط بطاقة" → AI guides the user through the card-linking flow conversationally

### Scenario 6 — Financial Q&A

1. Type: `كم صرفت هذا الشهر؟`
2. **Expected**: AI responds with the correct total expenses for the current month (matching the database)
3. Type: `ما أكثر فئة صرفت فيها؟`
4. **Expected**: AI names the category with the highest spend

### Scenario 7 — Session Message Persistence

1. Send 3 messages
2. Refresh the page
3. **Expected**: All 3 messages are still visible in the chat panel (DB-persisted history)

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| No receipt card appears after typing a transaction | Ensure `OPENROUTER_API_KEY` is set; check `/api/chat` logs for extraction errors |
| Mic button missing | Browser does not support Web Speech API — expected behaviour |
| "Confirm" shows an error | Check that at least one project exists; create one via `/projects` first |
| No proactive insights after seeding | Verify seed transactions are within the last 7 days; check `/api/chat/insights` response |
| Chat history empty on reload | Check Supabase `chat_messages` table for `anon-user` rows |
