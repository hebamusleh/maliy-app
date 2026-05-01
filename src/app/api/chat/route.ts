export const dynamic = "force-dynamic";

import { getRequestUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { classifyTransaction } from "@/lib/classification";
import { getSarToBaseRate, sarToDisplay, CURRENCY_LABELS } from "@/lib/exchange";
import { getUserSettings } from "@/lib/user-settings";
import type { TxReceiptCard } from "@/types/index";

const OPENROUTER_API = "https://openrouter.ai/api/v1/chat/completions";

const TX_INTENT_RE = /دفعت|صرفت|اشتريت|استلمت|حولت|سددت|وصل راتبي|دفع|شريت/;

function isTransactionIntent(message: string): boolean {
  return TX_INTENT_RE.test(message) && /\d/.test(message);
}

async function extractTransaction(
  message: string,
  apiKey: string | undefined
): Promise<{ merchant: string; amount: number; category: string; confidence: number }> {
  if (!apiKey) {
    const numMatch = message.match(/\d+(\.\d+)?/);
    const amount = numMatch ? -Math.abs(parseFloat(numMatch[0])) : 0;
    return { merchant: message.slice(0, 30), amount, category: "أخرى", confidence: 0 };
  }
  try {
    const res = await fetch(OPENROUTER_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "http://localhost:3000/",
        "X-Title": "Maliy",
      },
      body: JSON.stringify({
        model: "tencent/hy3-preview:free",
        messages: [
          {
            role: "system",
            content: `You are a financial data extractor. Extract transaction data from the user message and reply with ONLY a JSON object in this exact format, no other text:
{"merchant":"store or entity name","amount":<negative number for expense, positive for income>,"category":"Arabic category like مطاعم or سوبرماركت or راتب or مواصلات","confidence":<0-100>}`,
          },
          { role: "user", content: message },
        ],
        temperature: 0.1,
        max_tokens: 200,
      }),
    });
    if (!res.ok) throw new Error("extraction failed");
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : "{}");
    return {
      merchant: String(parsed.merchant ?? message.slice(0, 30)),
      amount: Number(parsed.amount ?? 0),
      category: String(parsed.category ?? "أخرى"),
      confidence: Math.min(100, Math.max(0, Number(parsed.confidence ?? 0))),
    };
  } catch {
    const numMatch = message.match(/\d+(\.\d+)?/);
    const amount = numMatch ? -Math.abs(parseFloat(numMatch[0])) : 0;
    return { merchant: message.slice(0, 30), amount, category: "أخرى", confidence: 0 };
  }
}

export async function POST(request: Request) {
  try {
    const user = await getRequestUser();

    const body = await request.json();
    const { message } = body as { message: string };

    if (!message?.trim()) {
      return Response.json({ error: "الرسالة فارغة" }, { status: 400 });
    }

    // Save user message
    const { error: userInsertErr } = await supabase.from("chat_messages").insert({
      // user_id: user.id,
      role: "user",
      content: message,
      rich_card: null,
    });
    if (userInsertErr) console.error("Failed to save user message:", userInsertErr);

    const isTx = isTransactionIntent(message);

    // ── Build dashboard context ──────────────────────────────────────────────
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .split("T")[0];

    const settings = await getUserSettings(user.id);
    const baseCurrency = settings.base_currency;
    const sarToBase = await getSarToBaseRate(baseCurrency, today);
    const cvt = (sar: number) => sarToDisplay(sar, sarToBase);
    const currencyLabel = CURRENCY_LABELS[baseCurrency] ?? baseCurrency;

    // Fetch all this-month transactions + their project join
    const { data: txs } = await supabase
      .from("transactions")
      .select("id, amount, amount_base, currency_original, exchange_rate, status, project_id, merchant, date, payment_last4, confidence_score, ai_reasoning")
      .eq("user_id", user.id)
      .gte("date", monthStart)
      .order("date", { ascending: false })
      .limit(200);

    const allTxs = txs ?? [];
    const classifiedTxs = allTxs.filter((t) => t.status === "classified");
    const pendingTxs    = allTxs.filter((t) => t.status === "pending");
    const cardLinkedTxs = classifiedTxs.filter(
      (t) => t.ai_reasoning?.includes("البطاقة المرتبطة") || t.confidence_score === 1.0
    );

    // Convert amount_base (SAR) to user's base currency for context
    const income   = cvt(classifiedTxs.reduce((s, t) => s + (t.amount_base > 0 ? t.amount_base : 0), 0));
    const expenses = cvt(classifiedTxs.reduce((s, t) => s + (t.amount_base < 0 ? Math.abs(t.amount_base) : 0), 0));

    // Currency diversity insight
    const foreignTxs = classifiedTxs.filter((t) => (t.currency_original ?? "SAR") !== baseCurrency);
    const foreignExpensesSar = foreignTxs
      .filter((t) => t.amount_base < 0)
      .reduce((s, t) => s + Math.abs(t.amount_base), 0);
    const foreignExpenses = cvt(foreignExpensesSar);
    const foreignPct = expenses > 0 ? Math.round((foreignExpenses / expenses) * 100) : 0;

    // Per-project data
    const { data: projects } = await supabase
      .from("projects")
      .select("id, name, icon, budget_limit, type")
      .eq("user_id", user.id)
      .limit(10);

    // Card links for context
    const { data: cardLinks } = await supabase
      .from("card_links")
      .select("last4, project_id, bank_name, card_network")
      .eq("user_id", user.id);

    const projectSpendMap = new Map<string, number>();
    for (const t of classifiedTxs) {
      if (t.project_id && t.amount < 0) {
        projectSpendMap.set(t.project_id, (projectSpendMap.get(t.project_id) ?? 0) + Math.abs(t.amount));
      }
    }

    const projectLines = (projects ?? [])
      .map((p) => {
        const spend = projectSpendMap.get(p.id) ?? 0;
        const pct = p.budget_limit ? Math.round((spend / p.budget_limit) * 100) : null;
        const linkedCards = (cardLinks ?? [])
          .filter((c) => c.project_id === p.id)
          .map((c) => `${c.card_network ?? ""} ••••${c.last4}`)
          .join(", ");
        const spendConverted = cvt(spend);
        return `  - ${p.icon} ${p.name} (${p.type}): مصروف ${spendConverted.toFixed(2)} ${baseCurrency}${pct !== null ? ` (${pct}% من الميزانية)` : ""}${linkedCards ? ` | بطاقات: ${linkedCards}` : ""}`;
      })
      .join("\n");

    // Recent pending transactions (up to 5) for context
    const pendingLines = pendingTxs
      .slice(0, 5)
      .map((t) => `  - ${t.merchant ?? "غير معروف"}: ${cvt(Math.abs(t.amount_base)).toFixed(2)} ${baseCurrency} (${t.date})`)
      .join("\n");

    // Recent classified transactions (last 5) for context
    const recentLines = classifiedTxs
      .slice(0, 5)
      .map((t) => {
        const baseAmt = cvt(t.amount_base);
        const sign = baseAmt > 0 ? "+" : "-";
        return `  - ${sign}${Math.abs(baseAmt).toFixed(2)} ${baseCurrency} — ${t.merchant ?? "—"} (${t.date})`;
      })
      .join("\n");

    const foreignCurrencyLine = foreignPct > 0
      ? `\n- مصروفات بعملات أجنبية: ${foreignExpenses.toFixed(0)} ريال (${foreignPct}% من الإجمالي)`
      : "";

    const txInstruction = isTx
      ? "\n\nالمستخدم يسجّل معاملة مالية. أخبره بأنك قمت بتسجيلها وانتظر تأكيده. لا تطلب منه تفاصيل إضافية."
      : "";

    const systemPrompt = `أنت ماليّ الذكي، مساعد مالي شخصي باللغة العربية. تحدث دائماً بالعربية الفصحى بأسلوب ودود ومهني.

السياق المالي الحالي للمستخدم (هذا الشهر — ${new Date().toLocaleDateString("ar-SA", { month: "long", year: "numeric" })}):
- العملة الأساسية: ${currencyLabel} (${baseCurrency})
- الدخل: ${income.toFixed(2)} ${baseCurrency}
- المصروفات: ${expenses.toFixed(2)} ${baseCurrency}
- الرصيد الصافي: ${(income - expenses).toFixed(2)} ${baseCurrency}
- معاملات مصنّفة: ${classifiedTxs.length} (منها ${cardLinkedTxs.length} تم ربطها تلقائياً عبر البطاقة)
- معاملات تنتظر التصنيف: ${pendingTxs.length}${foreignCurrencyLine}

الإنفاق حسب المشاريع:
${projectLines || "  - لا توجد مشاريع بعد"}

${pendingTxs.length > 0 ? `المعاملات المعلّقة التي تحتاج مراجعة:\n${pendingLines}` : "لا توجد معاملات معلّقة — كل المعاملات مصنّفة."}

آخر المعاملات المسجّلة:
${recentLines || "  - لا توجد معاملات بعد"}

قواعد الرد:
1. ردودك مختصرة ومفيدة (2-4 جمل في الغالب)
2. استخدم أرقاماً عند الإشارة للمبالغ بالريال
3. المعاملات المرتبطة بالبطاقات تُصنَّف تلقائياً — لا داعي لمراجعتها
4. شجّع على تصنيف المعاملات المعلّقة إن وُجدت
5. جميع الأرقام المعروضة بالريال السعودي (بعد تحويل العملات) — هذه هي الحقيقة المالية الكاملة
6. إن كانت نسبة العملات الأجنبية عالية، يمكنك ذكر تأثير فروق العملة على الميزانية${txInstruction}`;

    // Fetch recent chat history for context window
    const { data: history } = await supabase
      .from("chat_messages")
      .select("role, content")
      .order("created_at", { ascending: false })
      .limit(10);

    const recentMessages = (history ?? [])
      .reverse()
      .slice(-6)
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    const apiKey = process.env.OPENROUTER_API_KEY;

    // ── Transaction extraction + 3-layer pre-classification ─────────────────
    // Run concurrently to avoid blocking the stream
    const txExtractionPromise: Promise<{
      merchant: string;
      amount: number;
      category: string;
      confidence: number;
      suggestedProjectId: string | null;
    }> | null = isTx
      ? (async () => {
          const extracted = await extractTransaction(message, apiKey);
          // Try 3-layer classification (rules → history → AI) to pre-select a project
          // This does NOT go to AI again if a rule/history match exists
          let suggestedProjectId: string | null = null;
          if (extracted.merchant) {
            const classResult = await classifyTransaction(
              user.id,
              extracted.merchant,
              extracted.amount,
              { projectNames: (projects ?? []).map((p) => p.name) }
            );
            if (classResult) suggestedProjectId = classResult.project_id;
          }
          return { ...extracted, suggestedProjectId };
        })()
      : null;

    // ── No API key: canned response ──────────────────────────────────────────
    if (!apiKey) {
      const fallback = isTx
        ? "تم استلام معاملتك. يرجى مراجعة بطاقة التأكيد أدناه والضغط على تأكيد لحفظها."
        : "عذراً، خدمة الذكاء الاصطناعي غير متاحة حالياً. يمكنك مراجعة لوحة التحكم لعرض بياناتك المالية.";

      let richCard: TxReceiptCard | null = null;
      if (isTx && txExtractionPromise) {
        const extracted = await txExtractionPromise;
        // Build ordered suggestions: pre-selected project first
        const suggestions = (projects ?? []).map((p) => ({
          label: `${p.icon} ${p.name}`,
          project_id: p.id,
        }));
        if (extracted.suggestedProjectId) {
          suggestions.sort((a, b) =>
            a.project_id === extracted.suggestedProjectId ? -1
              : b.project_id === extracted.suggestedProjectId ? 1 : 0
          );
        }
        richCard = {
          type: "tx_receipt",
          transaction_id: null,
          merchant: extracted.merchant,
          amount: extracted.amount,
          category: extracted.category,
          confidence: extracted.confidence,
          suggestions,
          status: "pending",
        };
      }

      const { error: fbInsertErr } = await supabase.from("chat_messages").insert({
        role: "assistant",
        content: fallback,
        rich_card: richCard,
      });
      if (fbInsertErr) console.error("Failed to save fallback message:", fbInsertErr);

      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ type: "text", content: fallback })}\n\ndata: [DONE]\n\n`
            )
          );
          controller.close();
        },
      });
      return new Response(stream, {
        headers: {
          "Content-Type": "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
        },
      });
    }

    // ── Call OpenRouter with streaming ───────────────────────────────────────
    const openRouterRes = await fetch(OPENROUTER_API, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        // "HTTP-Referer": "https://maliy-app.com",
        "HTTP-Referer": "http://localhost:3000",
        "X-Title": "Maliy",
      },
      body: JSON.stringify({
        model: "tencent/hy3-preview:free",
        stream: true,
        messages: [
          { role: "system", content: systemPrompt },
          ...recentMessages,
          { role: "user", content: message },
        ],
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!openRouterRes.ok || !openRouterRes.body) {
      const errBody = await openRouterRes.text().catch(() => "");
      console.error("OpenRouter error:", openRouterRes.status, errBody);
      const fallback = `عذراً، خطأ: ${openRouterRes.status} - ${errBody}`;
      const { error: errInsertErr } = await supabase.from("chat_messages").insert({
        role: "assistant",
        content: fallback,
        rich_card: null,
      });
      if (errInsertErr) console.error("Failed to save error message:", errInsertErr);
      const errStream = new ReadableStream({
        start(controller) {
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ type: "text", content: fallback })}\n\ndata: [DONE]\n\n`
            )
          );
          controller.close();
        },
      });
      return new Response(errStream, {
        headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive" },
      });
    }

    // ── Pipe SSE stream to client ────────────────────────────────────────────
    let fullContent = "";
    const reader = openRouterRes.body.getReader();
    const decoder = new TextDecoder();

    const stream = new ReadableStream({
      async start(controller) {
        const encode = (s: string) => new TextEncoder().encode(s);
        let streamDone = false;
        try {
          while (!streamDone) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6).trim();
              if (data === "[DONE]") {
                streamDone = true;
                break;
              }
              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta ?? {};
                // Some models (e.g. reasoning models) put output in
                // `reasoning` / `reasoning_content` instead of `content`
                const text = delta.content || delta.reasoning || delta.reasoning_content || "";
                if (text) {
                  fullContent += text;
                  controller.enqueue(
                    encode(`data: ${JSON.stringify({ type: "text", content: text })}\n\n`)
                  );
                }
              } catch {
                // skip malformed chunks
              }
            }
          }
        } finally {
          // ── Save to DB FIRST, then send [DONE] ───────────────────────
          // If we send [DONE] before the DB write, the client's
          // invalidateQueries fires and refetches before the message is
          // stored → messages disappear. Saving first guarantees the
          // message exists by the time the client refetches.
          if (fullContent) {
            let richCard: TxReceiptCard | null = null;
            try {
              if (txExtractionPromise) {
                const extracted = await txExtractionPromise;
                const suggestions = (projects ?? []).map((p) => ({
                  label: `${p.icon} ${p.name}`,
                  project_id: p.id,
                }));
                if (extracted.suggestedProjectId) {
                  suggestions.sort((a, b) =>
                    a.project_id === extracted.suggestedProjectId ? -1
                      : b.project_id === extracted.suggestedProjectId ? 1 : 0
                  );
                }
                richCard = {
                  type: "tx_receipt",
                  transaction_id: null,
                  merchant: extracted.merchant,
                  amount: extracted.amount,
                  category: extracted.category,
                  confidence: extracted.confidence,
                  suggestions,
                  status: "pending",
                };
              }
            } catch {
              // extraction failure must not prevent saving the text reply
            }
            const { error: assistantInsertErr } = await supabase.from("chat_messages").insert({
              // user_id: user.id,
              role: "assistant",
              content: fullContent,
              rich_card: richCard,
            });
            if (assistantInsertErr) console.error("Failed to save assistant message:", assistantInsertErr);
          }
          // Send [DONE] AFTER DB write — client's invalidateQueries
          // refetch will always find the saved message.
          controller.enqueue(encode("data: [DONE]\n\n"));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("POST /api/chat error:", err);
    return Response.json(
      { error: "خطأ داخلي", details: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}
