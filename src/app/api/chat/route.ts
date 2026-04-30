export const dynamic = "force-dynamic";

import { getRequestUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
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
        "HTTP-Referer": "https://maliy-app.com",
        "X-Title": "ماليّ",
      },
      body: JSON.stringify({
        model: "tencent/hy3-preview:free",
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `أنت محلل مالي. استخرج من رسالة المستخدم بيانات المعاملة المالية وأعد JSON بهذا الشكل فقط:
{"merchant":"اسم المحل أو الجهة","amount":<رقم سالب للمصروف موجب للدخل>,"category":"فئة عربية مثل مطاعم أو سوبرماركت أو راتب أو مواصلات","confidence":<0-100>}
لا تضف أي نص خارج JSON.`,
          },
          { role: "user", content: message },
        ],
        temperature: 0.1,
        max_tokens: 150,
      }),
    });
    if (!res.ok) throw new Error("extraction failed");
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(raw);
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
  const user = await getRequestUser();

  const body = await request.json();
  const { message } = body as { message: string };

  if (!message?.trim()) {
    return Response.json({ error: "الرسالة فارغة" }, { status: 400 });
  }

  // Save user message
  await supabase.from("chat_messages").insert({
    user_id: user.id,
    role: "user",
    content: message,
    rich_card: null,
  });

  const isTx = isTransactionIntent(message);

  // Fetch dashboard context for system prompt
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const { data: txs } = await supabase
    .from("transactions")
    .select("amount, status, project_id, category_id, spending_categories(name_ar)")
    .eq("user_id", user.id)
    .gte("date", monthStart);

  const classified = (txs ?? []).filter((t) => t.status === "classified");
  const income = classified.reduce((s, t) => s + (t.amount > 0 ? t.amount : 0), 0);
  const expenses = classified.reduce((s, t) => s + (t.amount < 0 ? Math.abs(t.amount) : 0), 0);
  const pending = (txs ?? []).filter((t) => t.status === "pending").length;

  // Per-category spend (top 3)
  const categoryMap = new Map<string, number>();
  for (const t of classified) {
    if (t.amount < 0) {
      const cat = (t as { spending_categories?: { name_ar?: string } }).spending_categories?.name_ar ?? "أخرى";
      categoryMap.set(cat, (categoryMap.get(cat) ?? 0) + Math.abs(t.amount));
    }
  }
  const topCategories = [...categoryMap.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([name, amt]) => `  - ${name}: ${amt.toFixed(0)} ريال`)
    .join("\n");

  // Per-project spend
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, icon, budget_limit")
    .eq("user_id", user.id)
    .limit(10);

  const projectSpendMap = new Map<string, number>();
  for (const t of classified) {
    if (t.project_id && t.amount < 0) {
      projectSpendMap.set(t.project_id, (projectSpendMap.get(t.project_id) ?? 0) + Math.abs(t.amount));
    }
  }
  const projectLines = (projects ?? [])
    .map((p) => {
      const spend = projectSpendMap.get(p.id) ?? 0;
      const pct = p.budget_limit ? Math.round((spend / p.budget_limit) * 100) : null;
      return `  - ${p.icon} ${p.name}: ${spend.toFixed(0)} ريال${pct !== null ? ` (${pct}% من الميزانية)` : ""}`;
    })
    .join("\n");

  const txInstruction = isTx
    ? "\n\nالمستخدم يسجّل معاملة مالية. أخبره بأنك قمت بتسجيلها وانتظر تأكيده. لا تطلب منه تفاصيل إضافية."
    : "";

  const systemPrompt = `أنت ماليّ الذكي، مساعد مالي شخصي باللغة العربية. تحدث دائماً بالعربية الفصحى بأسلوب ودود ومهني.

السياق المالي الحالي للمستخدم (هذا الشهر):
- الدخل: ${income.toFixed(0)} ريال
- المصروفات: ${expenses.toFixed(0)} ريال
- الرصيد الصافي: ${(income - expenses).toFixed(0)} ريال
- معاملات تنتظر التصنيف: ${pending}

أعلى فئات الإنفاق هذا الشهر:
${topCategories || "  - لا توجد بيانات بعد"}

الإنفاق حسب المشاريع:
${projectLines || "  - لا توجد مشاريع بعد"}

قواعد الرد:
1. ردودك مختصرة ومفيدة (2-4 جمل في الغالب)
2. استخدم أرقاماً عند الإشارة للمبالغ بالريال
3. إذا سُئلت عن معاملة محددة، اعترف بأنك لا تملك تفاصيلها الكاملة واقترح زيارة صفحة المعاملات
4. شجّع على التصنيف عند وجود معاملات معلقة${txInstruction}`;

  // Fetch recent chat history
  const { data: history } = await supabase
    .from("chat_messages")
    .select("role, content")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  const recentMessages = (history ?? [])
    .reverse()
    .slice(-6) // last 6 messages for context window
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

  const apiKey = process.env.OPENROUTER_API_KEY;

  // Start transaction extraction concurrently (runs while stream is piped)
  const txExtractionPromise = isTx
    ? extractTransaction(message, apiKey)
    : null;

  // If no API key, return a canned response
  if (!apiKey) {
    const fallback = isTx
      ? "تم استلام معاملتك. يرجى مراجعة بطاقة التأكيد أدناه والضغط على تأكيد لحفظها."
      : "عذراً، خدمة الذكاء الاصطناعي غير متاحة حالياً. يمكنك مراجعة لوحة التحكم لعرض بياناتك المالية.";

    let richCard: TxReceiptCard | null = null;
    if (isTx && txExtractionPromise) {
      const extracted = await txExtractionPromise;
      richCard = {
        type: "tx_receipt",
        transaction_id: null,
        merchant: extracted.merchant,
        amount: extracted.amount,
        category: extracted.category,
        confidence: extracted.confidence,
        suggestions: (projects ?? []).map((p) => ({ label: `${p.icon} ${p.name}`, project_id: p.id })),
        status: "pending",
      };
    }

    await supabase.from("chat_messages").insert({
      user_id: user.id,
      role: "assistant",
      content: fallback,
      rich_card: richCard,
    });
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(`data: ${JSON.stringify({ type: "text", content: fallback })}\n\ndata: [DONE]\n\n`)
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

  // Call OpenRouter with streaming
  const openRouterRes = await fetch(OPENROUTER_API, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://maliy-app.com",
      "X-Title": "ماليّ",
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
      max_tokens: 512,
    }),
  });

  if (!openRouterRes.ok || !openRouterRes.body) {
    const fallback = "عذراً، حدث خطأ في الاتصال. حاول مجدداً بعد قليل.";
    await supabase.from("chat_messages").insert({
      user_id: user.id,
      role: "assistant",
      content: fallback,
      rich_card: null,
    });
    return Response.json({ error: fallback }, { status: 502 });
  }

  // Pipe SSE stream to client
  let fullContent = "";
  const reader = openRouterRes.body.getReader();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const encode = (s: string) => new TextEncoder().encode(s);
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (!line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]") {
              controller.enqueue(encode("data: [DONE]\n\n"));
              break;
            }
            try {
              const parsed = JSON.parse(data);
              const text = parsed.choices?.[0]?.delta?.content ?? "";
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
        controller.close();
        // Save assistant response to DB with optional receipt card
        if (fullContent) {
          let richCard: TxReceiptCard | null = null;
          if (txExtractionPromise) {
            const extracted = await txExtractionPromise;
            richCard = {
              type: "tx_receipt",
              transaction_id: null,
              merchant: extracted.merchant,
              amount: extracted.amount,
              category: extracted.category,
              confidence: extracted.confidence,
              suggestions: (projects ?? []).map((p) => ({
                label: `${p.icon} ${p.name}`,
                project_id: p.id,
              })),
              status: "pending",
            };
          }
          await supabase.from("chat_messages").insert({
            user_id: user.id,
            role: "assistant",
            content: fullContent,
            rich_card: richCard,
          });
        }
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
}
