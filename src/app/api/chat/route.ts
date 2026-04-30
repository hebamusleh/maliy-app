export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";

const OPENROUTER_API = "https://openrouter.ai/api/v1/chat/completions";

export async function POST(request: Request) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  // Fetch dashboard context for system prompt
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];

  const { data: txs } = await supabase
    .from("transactions")
    .select("amount, status, project_id")
    .eq("user_id", user.id)
    .gte("date", monthStart);

  const classified = (txs ?? []).filter((t) => t.status === "classified");
  const income = classified.reduce((s, t) => s + (t.amount > 0 ? t.amount : 0), 0);
  const expenses = classified.reduce((s, t) => s + (t.amount < 0 ? Math.abs(t.amount) : 0), 0);
  const pending = (txs ?? []).filter((t) => t.status === "pending").length;

  const systemPrompt = `أنت ماليّ الذكي، مساعد مالي شخصي باللغة العربية. تحدث دائماً بالعربية الفصحى بأسلوب ودود ومهني.

السياق المالي الحالي للمستخدم (هذا الشهر):
- الدخل: ${income.toFixed(0)} ريال
- المصروفات: ${expenses.toFixed(0)} ريال
- الرصيد الصافي: ${(income - expenses).toFixed(0)} ريال
- معاملات تنتظر التصنيف: ${pending}

قواعد الرد:
1. ردودك مختصرة ومفيدة (2-4 جمل في الغالب)
2. استخدم أرقاماً عند الإشارة للمبالغ بالريال
3. إذا سُئلت عن معاملة محددة، اعترف بأنك لا تملك تفاصيلها الكاملة واقترح زيارة صفحة المعاملات
4. شجّع على التصنيف عند وجود معاملات معلقة`;

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

  // If no API key, return a canned response
  if (!apiKey) {
    const fallback = "عذراً، خدمة الذكاء الاصطناعي غير متاحة حالياً. يمكنك مراجعة لوحة التحكم لعرض بياناتك المالية.";
    await supabase.from("chat_messages").insert({
      user_id: user.id,
      role: "assistant",
      content: fallback,
      rich_card: null,
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
        // Save assistant response to DB
        if (fullContent) {
          await supabase.from("chat_messages").insert({
            user_id: user.id,
            role: "assistant",
            content: fullContent,
            rich_card: null,
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
