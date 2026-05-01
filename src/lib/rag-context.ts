/**
 * RAG Context Builder — SPEC 009b
 *
 * Builds a structured Claude prompt context by traversing the Knowledge Graph.
 * Called by the chat route when a transaction intent is detected.
 *
 * Input:  userId, transactionText, merchantHint, categoryHint
 * Output: enriched context string injected into the Claude system prompt
 */

import { supabase } from "./supabase";
import { traverseGraph } from "./knowledge-graph";

export interface RagContextInput {
  userId: string;
  userText: string;
  merchantHint: string;
  categoryHint: string | null;
  amount: number;
}

export interface RagContextResult {
  contextBlock: string;        // markdown block to inject into Claude prompt
  suggestedProjectId: string | null; // best guess from graph traversal
  suggestedCategory: string | null;
  graphConfidence: number;     // 0.0–1.0 confidence from graph alone
}

export async function buildRagContext(input: RagContextInput): Promise<RagContextResult> {
  const { userId, userText, merchantHint, categoryHint, amount } = input;

  // ── 1. Traverse Knowledge Graph ──────────────────────────────────────────
  const graph = await traverseGraph(userId, merchantHint, categoryHint);

  // ── 2. Fetch user's projects + card links ────────────────────────────────
  const [{ data: projects }, { data: cardLinks }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, icon, type")
      .eq("user_id", userId)
      .limit(10),
    supabase
      .from("card_links")
      .select("last4, project_id")
      .eq("user_id", userId),
  ]);

  // ── 3. Determine best project from graph context ─────────────────────────
  let suggestedProjectId: string | null = null;
  let graphConfidence = 0.0;

  // Count project frequency from similar transactions
  const projectFreq: Record<string, number> = {};
  for (const tx of graph.similarTransactions) {
    if (tx.project_id) {
      projectFreq[tx.project_id] = (projectFreq[tx.project_id] ?? 0) + 1;
    }
  }
  const topEntry = Object.entries(projectFreq).sort((a, b) => b[1] - a[1])[0];
  if (topEntry && graph.similarTransactions.length > 0) {
    suggestedProjectId = topEntry[0];
    graphConfidence = Math.min(0.85, topEntry[1] / graph.similarTransactions.length * 0.8);
  }

  // Boost confidence if we have strong merchant→category edges
  if (graph.topCategories.length > 0) {
    const totalWeight = graph.topCategories.reduce((s, c) => s + c.weight, 0);
    const topWeight = graph.topCategories[0].weight;
    if (totalWeight > 0) {
      graphConfidence = Math.min(0.9, graphConfidence + (topWeight / totalWeight) * 0.2);
    }
  }

  // Determine best category from graph
  const suggestedCategory = graph.topCategories[0]?.name_ar ?? categoryHint ?? null;

  // ── 4. Build context block ───────────────────────────────────────────────
  const lines: string[] = [];

  // Projects list
  const projectList = (projects ?? [])
    .map((p: { id: string; name: string; icon: string; type: string }) => {
      const cards = (cardLinks ?? [])
        .filter((c: { last4: string; project_id: string }) => c.project_id === p.id)
        .map((c: { last4: string }) => `••••${c.last4}`)
        .join(", ");
      return `- ${p.icon} ${p.name} (${p.type})${cards ? ` [بطاقة: ${cards}]` : ""}`;
    })
    .join("\n");

  lines.push(`مشاريع المستخدم:\n${projectList || "لا توجد مشاريع"}`);

  // Merchant graph context
  if (graph.merchant) {
    lines.push(`\nمعلومات التاجر من الرسم البياني:`);
    lines.push(`- التاجر: "${graph.merchant.name}" (normalized: "${graph.merchant.normalized_name}")`);

    if (graph.topCategories.length > 0) {
      const catList = graph.topCategories
        .map((c) => `${c.name_ar} (وزن: ${c.weight.toFixed(1)})`)
        .join("، ");
      lines.push(`- الفئات المرتبطة سابقاً: ${catList}`);
    } else {
      lines.push(`- لا توجد فئات سابقة لهذا التاجر`);
    }

    if (graph.timePattern) {
      const pattern = graph.timePattern;
      const when = pattern.month_day
        ? `اليوم ${pattern.month_day} من كل شهر`
        : pattern.day_of_week !== null
          ? `كل أسبوع يوم ${["الأحد","الاثنين","الثلاثاء","الأربعاء","الخميس","الجمعة","السبت"][pattern.day_of_week]}`
          : null;
      if (when) {
        lines.push(`- نمط متكرر: ${when} (${pattern.occurrence_count} مرة)`);
      }
    }
  } else {
    lines.push(`\nالتاجر "${merchantHint}" غير معروف في الرسم البياني — معاملة جديدة`);
  }

  // Similar past transactions
  if (graph.similarTransactions.length > 0) {
    lines.push(`\nمعاملات مشابهة سابقة (${graph.similarTransactions.length}):`);
    for (const tx of graph.similarTransactions.slice(0, 5)) {
      const proj = (projects ?? []).find(
        (p: { id: string; name: string }) => p.id === tx.project_id
      );
      const projName = proj ? `${proj.name}` : "غير مصنّف";
      lines.push(`- ${tx.merchant}: ${Math.abs(tx.amount)} ريال → ${projName} (${tx.date})`);
    }
  }

  // Suggested project from graph
  if (suggestedProjectId) {
    const proj = (projects ?? []).find(
      (p: { id: string; name: string; icon: string }) => p.id === suggestedProjectId
    );
    if (proj) {
      lines.push(`\nاقتراح الرسم البياني: مشروع "${proj.icon} ${proj.name}" (ثقة: ${Math.round(graphConfidence * 100)}%)`);
    }
  }

  // Transaction being classified
  lines.push(`\nالمعاملة الجديدة للتصنيف:`);
  lines.push(`- النص الأصلي: "${userText}"`);
  lines.push(`- التاجر المستخرج: "${merchantHint}"`);
  lines.push(`- المبلغ: ${Math.abs(amount)} ريال (${amount < 0 ? "مصروف" : "دخل"})`);
  if (categoryHint) lines.push(`- الفئة المقترحة من الاستخراج: ${categoryHint}`);

  return {
    contextBlock: lines.join("\n"),
    suggestedProjectId,
    suggestedCategory,
    graphConfidence,
  };
}
