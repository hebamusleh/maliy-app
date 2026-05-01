export const dynamic = "force-dynamic";

import { getRequestUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { classifyTransaction } from "@/lib/classification";

export async function POST() {
  const user = await getRequestUser();
  const now = new Date().toISOString();

  // Fetch all pending transactions
  const { data: pending } = await supabase
    .from("transactions")
    .select("id, merchant, amount, payment_last4")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .limit(100);

  if (!pending?.length) {
    return Response.json({ classified_count: 0, still_pending_count: 0, results: [] });
  }

  // ── Step 1: Card-link auto-classification (no AI, confidence = 1.0) ──────
  // Build a map of last4 → project_id from card_links for this user
  const { data: cardLinks } = await supabase
    .from("card_links")
    .select("last4, project_id")
    .eq("user_id", user.id);

  const cardMap = new Map<string, string>();
  for (const link of cardLinks ?? []) {
    if (!cardMap.has(link.last4)) cardMap.set(link.last4, link.project_id);
  }

  const cardResults: Array<{ transaction_id: string; project_id: string; source: "card" }> = [];
  const remainingPending: typeof pending = [];

  for (const tx of pending) {
    if (tx.payment_last4 && cardMap.has(tx.payment_last4)) {
      const projectId = cardMap.get(tx.payment_last4)!;
      await supabase
        .from("transactions")
        .update({
          project_id: projectId,
          confidence_score: 1.0,
          ai_reasoning: `تم التصنيف تلقائياً عبر البطاقة المرتبطة (••••${tx.payment_last4})`,
          status: "classified",
          classified_at: now,
          updated_at: now,
        })
        .eq("id", tx.id);
      cardResults.push({ transaction_id: tx.id, project_id: projectId, source: "card" });
    } else {
      remainingPending.push(tx);
    }
  }

  // ── Step 2: AI classification for remaining (no card match) ───────────────
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, type")
    .eq("user_id", user.id);

  const projectNames = projects?.map((p) => p.name) ?? [];

  const aiResults: Array<{ transaction_id: string; project_id: string; confidence: number; source: "ai" | "rules" | "history" }> = [];

  for (const tx of remainingPending) {
    if (!tx.merchant) continue;
    const result = await classifyTransaction(user.id, tx.merchant, tx.amount, { projectNames });
    if (result && result.confidence >= 0.9) {
      await supabase
        .from("transactions")
        .update({
          project_id: result.project_id,
          confidence_score: result.confidence,
          ai_reasoning: result.reasoning,
          status: "classified",
          classified_at: now,
          updated_at: now,
        })
        .eq("id", tx.id);
      aiResults.push({
        transaction_id: tx.id,
        project_id: result.project_id,
        confidence: result.confidence,
        source: result.layer_used,
      });
    }
  }

  const totalClassified = cardResults.length + aiResults.length;
  const stillPending = pending.length - totalClassified;

  return Response.json({
    classified_count: totalClassified,
    card_classified_count: cardResults.length,
    ai_classified_count: aiResults.length,
    still_pending_count: stillPending,
    results: [...cardResults, ...aiResults],
  });
}
