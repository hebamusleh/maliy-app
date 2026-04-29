import { supabase } from "./supabase";

export interface ClassificationResult {
  project_id: string;
  confidence: number;
  reasoning: string;
  layer_used: "rules" | "history" | "ai";
}

/**
 * 3-layer classification pipeline per Constitution III:
 * Layer 1: Rules Engine (merchant_pattern exact match)
 * Layer 2: User History (≥3 previous classifications for same merchant)
 * Layer 3: AI (OpenRouter tencent/hy3-preview:free)
 */
export async function classifyTransaction(
  userId: string,
  merchant: string,
  amount: number,
  existingContext?: { projectNames: string[] }
): Promise<ClassificationResult | null> {
  const merchantLower = merchant.toLowerCase().trim();

  // ─── Layer 1: Rules Engine ───────────────────────────────
  const { data: rule } = await supabase
    .from("classification_rules")
    .select("project_id, category_id")
    .eq("user_id", userId)
    .eq("merchant_pattern", merchantLower)
    .single();

  if (rule) {
    return {
      project_id: rule.project_id,
      confidence: 1.0,
      reasoning: `قاعدة محفوظة: تاجر "${merchant}" يُصنَّف دائمًا لهذا المشروع`,
      layer_used: "rules",
    };
  }

  // ─── Layer 2: User History ───────────────────────────────
  const { data: history } = await supabase
    .from("transactions")
    .select("project_id")
    .eq("user_id", userId)
    .eq("status", "classified")
    .ilike("merchant", merchant)
    .not("project_id", "is", null)
    .limit(20);

  if (history && history.length >= 3) {
    // Count by project_id
    const freq: Record<string, number> = {};
    for (const tx of history) {
      if (tx.project_id) freq[tx.project_id] = (freq[tx.project_id] || 0) + 1;
    }
    const topProjectId = Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
    const topCount = freq[topProjectId];
    const confidence = topCount / (history.length + 1);

    return {
      project_id: topProjectId,
      confidence,
      reasoning: `بناءً على ${topCount} معاملة سابقة مع "${merchant}"`,
      layer_used: "history",
    };
  }

  // ─── Layer 3: AI (OpenRouter) ────────────────────────────
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) return null;

  const projectContext = existingContext?.projectNames?.join(", ") ?? "شخصي، عمل، فريلانس";

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer": "https://maliy-app.com",
        "X-Title": "ماليّ",
      },
      body: JSON.stringify({
        model: "tencent/hy3-preview:free",
        messages: [
          {
            role: "system",
            content:
              "أنت مساعد مالي. صنّف المعاملة التالية وأعد JSON فقط: {\"project_type\":\"personal|business|freelance\",\"confidence\":0.0-1.0,\"reasoning\":\"سبب قصير بالعربية\"}",
          },
          {
            role: "user",
            content: `التاجر: ${merchant}\nالمبلغ: ${amount} ريال\nالمشاريع المتاحة: ${projectContext}`,
          },
        ],
        temperature: 0.2,
        max_tokens: 120,
      }),
    });

    if (!response.ok) return null;

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content ?? "";
    const jsonMatch = content.match(/\{[\s\S]*?\}/);
    if (!jsonMatch) return null;

    const parsed = JSON.parse(jsonMatch[0]);

    // Map project_type to a project_id — fetch user's project of that type
    const { data: project } = await supabase
      .from("projects")
      .select("id")
      .eq("user_id", userId)
      .eq("type", parsed.project_type === "personal" ? "personal" : parsed.project_type === "business" ? "business" : "freelance")
      .limit(1)
      .single();

    if (!project) return null;

    return {
      project_id: project.id,
      confidence: Math.min(Math.max(parsed.confidence ?? 0.5, 0), 1),
      reasoning: parsed.reasoning ?? `تصنيف AI: "${merchant}"`,
      layer_used: "ai",
    };
  } catch {
    return null;
  }
}

/**
 * Save user's classification choice as a learned rule
 */
export async function learnClassification(
  userId: string,
  merchant: string,
  projectId: string,
  categoryId?: string | null
): Promise<void> {
  const merchantLower = merchant.toLowerCase().trim();

  await supabase.from("classification_rules").upsert(
    {
      user_id: userId,
      merchant_pattern: merchantLower,
      project_id: projectId,
      category_id: categoryId ?? null,
      confirmation_count: 1,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,merchant_pattern",
      ignoreDuplicates: false,
    }
  );
}
