export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";
import { classifyTransaction } from "@/lib/classification";

export async function POST() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get all pending transactions
  const { data: pending } = await supabase
    .from("transactions")
    .select("id, merchant, amount")
    .eq("user_id", user.id)
    .eq("status", "pending")
    .limit(100);

  if (!pending?.length) {
    return Response.json({ classified_count: 0, still_pending_count: 0, results: [] });
  }

  // Get user projects for context
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, type")
    .eq("user_id", user.id);

  const projectNames = projects?.map((p) => p.name) ?? [];

  const results: Array<{ transaction_id: string; project_id: string; confidence: number }> = [];
  const now = new Date().toISOString();

  for (const tx of pending) {
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

      results.push({ transaction_id: tx.id, project_id: result.project_id, confidence: result.confidence });
    }
  }

  const stillPending = pending.length - results.length;

  return Response.json({
    classified_count: results.length,
    still_pending_count: stillPending,
    results,
  });
}
