export const dynamic = "force-dynamic";

import { getRequestUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { InsightCard } from "@/types/index";

export async function GET() {
  const user = await getRequestUser();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    .toISOString()
    .split("T")[0];

  // Fetch last 30 days of transactions
  const { data: txs } = await supabase
    .from("transactions")
    .select("merchant, amount, project_id, date")
    .eq("user_id", user.id)
    .gte("date", thirtyDaysAgo);

  const allTxs = txs ?? [];
  const recentTxs = allTxs.filter((t) => t.date >= sevenDaysAgo);

  // Fetch projects for budget warning check
  const { data: projects } = await supabase
    .from("projects")
    .select("id, name, icon, budget_limit")
    .eq("user_id", user.id)
    .not("budget_limit", "is", null);

  const detectedPatterns: Array<{
    pattern: InsightCard["pattern"];
    content: string;
    action_label: string;
    action_payload: Record<string, unknown>;
  }> = [];

  // ── Pattern 1: Repeated merchant (≥ 3 times in last 7 days) ──
  const merchantCount = new Map<string, number>();
  const merchantSum = new Map<string, number>();
  for (const t of recentTxs) {
    const m = t.merchant ?? "";
    merchantCount.set(m, (merchantCount.get(m) ?? 0) + 1);
    merchantSum.set(m, (merchantSum.get(m) ?? 0) + Math.abs(t.amount));
  }
  for (const [merchant, count] of merchantCount.entries()) {
    if (count >= 3 && merchant) {
      const total = (merchantSum.get(merchant) ?? 0).toFixed(0);
      detectedPatterns.push({
        pattern: "repeated_merchant",
        content: `دفعتَ في "${merchant}" ${count} مرات خلال الأسبوع الماضي — المجموع ${total} ريال. هل تريد تصنيف هذه المعاملات ضمن مشروع معين؟`,
        action_label: `تصنيف معاملات ${merchant}`,
        action_payload: { merchant, count, total },
      });
      break; // report one merchant per check
    }
  }

  // ── Pattern 2: Budget warning (≥ 85% of budget used) ──
  const projectSpend = new Map<string, number>();
  for (const t of allTxs) {
    if (t.project_id && t.amount < 0) {
      projectSpend.set(t.project_id, (projectSpend.get(t.project_id) ?? 0) + Math.abs(t.amount));
    }
  }
  for (const p of projects ?? []) {
    if (!p.budget_limit) continue;
    const spend = projectSpend.get(p.id) ?? 0;
    const pct = (spend / p.budget_limit) * 100;
    if (pct >= 85) {
      detectedPatterns.push({
        pattern: "budget_warning",
        content: `مشروع ${p.icon} ${p.name} استهلك ${Math.round(pct)}% من ميزانيته هذا الشهر (${spend.toFixed(0)} من ${p.budget_limit} ريال). راجع المصاريف قبل تجاوز الحد.`,
        action_label: "مراجعة الميزانية",
        action_payload: { project_id: p.id, project_name: p.name, pct: Math.round(pct) },
      });
      break;
    }
  }

  // ── Pattern 3: Anomaly (single expense > 3× daily average) ──
  const totalExpenses = allTxs.reduce(
    (s, t) => s + (t.amount < 0 ? Math.abs(t.amount) : 0),
    0
  );
  const dailyAvg = totalExpenses / 30;
  if (dailyAvg > 0) {
    for (const t of allTxs) {
      if (t.amount < 0 && Math.abs(t.amount) > 3 * dailyAvg) {
        detectedPatterns.push({
          pattern: "anomaly",
          content: `مبلغ ${Math.abs(t.amount).toFixed(0)} ريال في "${t.merchant ?? "جهة غير معروفة"}" يعادل ${Math.round(Math.abs(t.amount) / dailyAvg)}× متوسطك اليومي. هل هذه المعاملة صحيحة؟`,
          action_label: "مراجعة المعاملة",
          action_payload: { merchant: t.merchant, amount: t.amount, date: t.date },
        });
        break;
      }
    }
  }

  if (detectedPatterns.length === 0) {
    return Response.json({ insights_sent: 0, patterns: [] });
  }

  // Check which patterns were already sent in the last 24 hours
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recentInsights } = await supabase
    .from("chat_messages")
    .select("rich_card")
    .eq("user_id", user.id)
    .eq("role", "assistant")
    .gte("created_at", oneDayAgo);

  const sentPatterns = new Set<string>();
  for (const msg of recentInsights ?? []) {
    const card = msg.rich_card as { type?: string; pattern?: string } | null;
    if (card?.type === "insight" && card.pattern) {
      sentPatterns.add(card.pattern);
    }
  }

  // Insert new insight messages
  let insightsSent = 0;
  const sentPatternNames: string[] = [];

  for (const p of detectedPatterns) {
    if (sentPatterns.has(p.pattern)) continue;

    const insightCard: InsightCard = {
      type: "insight",
      pattern: p.pattern,
      action_label: p.action_label,
      action_payload: p.action_payload,
    };

    await supabase.from("chat_messages").insert({
      user_id: user.id,
      role: "assistant",
      content: p.content,
      rich_card: insightCard,
    });

    insightsSent++;
    sentPatternNames.push(p.pattern);
  }

  return Response.json({ insights_sent: insightsSent, patterns: sentPatternNames });
}
