export const dynamic = "force-dynamic";

/**
 * POST /api/alerts/generate
 *
 * SPEC 011 — Smart alert generation engine.
 * Scans the user's financial data and inserts alerts for:
 *   1. Budget threshold (80%, 90%, 100%)
 *   2. Cash flow danger (net < 0 within 12 days at current burn rate)
 *   3. Recurring bill due in ≤ 3 days (from kg_time_patterns)
 *   4. Unusual spend (single tx > 3× daily average)
 *   5. Weekly summary (Sundays only)
 *
 * Returns { generated: N, skipped: N, alerts: [...] }
 */

import { getRequestUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

interface AlertRow {
  type: string;
  title: string;
  body: string;
  action_type: "navigate" | "confirm" | "dismiss-only" | null;
  action_payload: Record<string, unknown> | null;
}

async function recentAlertExists(userId: string, title: string, withinHours = 24): Promise<boolean> {
  const since = new Date(Date.now() - withinHours * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from("alerts")
    .select("id")
    .eq("user_id", userId)
    .eq("title", title)
    .gte("created_at", since)
    .limit(1);
  return (data?.length ?? 0) > 0;
}

export async function POST(request: Request) {
  const user = await getRequestUser();

  const now = new Date();
  const today = now.toISOString().split("T")[0];
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0];
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const toGenerate: AlertRow[] = [];

  // ── Fetch base data ──────────────────────────────────────────────────────
  const [{ data: projects }, { data: txs }] = await Promise.all([
    supabase
      .from("projects")
      .select("id, name, icon, budget_limit")
      .eq("user_id", user.id),
    supabase
      .from("transactions")
      .select("id, amount, amount_base, date, merchant, project_id, status")
      .eq("user_id", user.id)
      .gte("date", thirtyDaysAgo)
      .order("date", { ascending: false }),
  ]);

  const allTxs = txs ?? [];
  const thisMonthTxs = allTxs.filter((t) => t.date >= monthStart);
  const classifiedThisMonth = thisMonthTxs.filter((t) => t.status === "classified");

  // ── 1. Budget threshold alerts ───────────────────────────────────────────
  for (const project of projects ?? []) {
    if (!project.budget_limit) continue;

    const spend = classifiedThisMonth
      .filter((t) => t.project_id === project.id && (t.amount_base ?? t.amount) < 0)
      .reduce((s, t) => s + Math.abs(t.amount_base ?? t.amount), 0);

    const pct = (spend / project.budget_limit) * 100;

    let threshold: number | null = null;
    if (pct >= 100) threshold = 100;
    else if (pct >= 90) threshold = 90;
    else if (pct >= 80) threshold = 80;

    if (threshold !== null) {
      const title = `${project.icon} ${project.name}: ${Math.round(pct)}% من الميزانية`;
      if (await recentAlertExists(user.id, title, 48)) continue;
      toGenerate.push({
        type: threshold >= 100 ? "urgent" : "recommendation",
        title,
        body: threshold >= 100
          ? `تجاوزت ميزانية مشروع "${project.name}" بنسبة ${Math.round(pct - 100)}%. راجع الإنفاق فوراً.`
          : `وصلت إلى ${Math.round(pct)}% من ميزانية "${project.name}". الميزانية المتبقية: ${(project.budget_limit - spend).toFixed(0)} ريال.`,
        action_type: "navigate",
        action_payload: { route: `/projects/${project.id}` },
      });
    }
  }

  // ── 2. Cash flow danger ──────────────────────────────────────────────────
  const last7DaysTxs = allTxs.filter((t) => {
    const d = new Date(t.date);
    return d >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  });

  const last7Income = last7DaysTxs
    .filter((t) => (t.amount_base ?? t.amount) > 0)
    .reduce((s, t) => s + (t.amount_base ?? t.amount), 0);
  const last7Expenses = last7DaysTxs
    .filter((t) => (t.amount_base ?? t.amount) < 0)
    .reduce((s, t) => s + Math.abs(t.amount_base ?? t.amount), 0);

  const dailyBurnRate = last7Expenses / 7;
  const dailyIncomeRate = last7Income / 7;
  const netDailyRate = dailyIncomeRate - dailyBurnRate;

  if (netDailyRate < 0) {
    const daysUntilDanger = Math.floor(last7Income / (dailyBurnRate - dailyIncomeRate));
    if (daysUntilDanger <= 12 && daysUntilDanger > 0) {
      const title = `تحذير: خطر مالي خلال ${daysUntilDanger} يوم`;
      if (!(await recentAlertExists(user.id, title, 24))) {
        toGenerate.push({
          type: "urgent",
          title,
          body: `معدل إنفاقك اليومي (${dailyBurnRate.toFixed(0)} ريال) يتجاوز دخلك اليومي (${dailyIncomeRate.toFixed(0)} ريال). راجع مصروفاتك قبل نفاد الرصيد.`,
          action_type: "navigate",
          action_payload: { route: "/dashboard" },
        });
      }
    }
  }

  // ── 3. Recurring bill due in ≤ 3 days ───────────────────────────────────
  const currentMonthDay = now.getDate();
  const { data: timePatterns } = await supabase
    .from("kg_time_patterns")
    .select("merchant_id, month_day, occurrence_count, kg_merchants(name)")
    .eq("user_id", user.id)
    .gte("occurrence_count", 2)
    .not("month_day", "is", null);

  for (const pattern of timePatterns ?? []) {
    const daysUntil = (pattern.month_day - currentMonthDay + 31) % 31;
    if (daysUntil <= 3 && daysUntil >= 0) {
      const merchantName = (pattern.kg_merchants as { name: string } | null)?.name ?? "تاجر";
      const title = `فاتورة ${merchantName} خلال ${daysUntil === 0 ? "اليوم" : `${daysUntil} أيام`}`;
      if (await recentAlertExists(user.id, title, 72)) continue;
      toGenerate.push({
        type: "reminder",
        title,
        body: `بناءً على نمط الدفع المتكرر، من المتوقع أن تستحق فاتورة "${merchantName}" ${daysUntil === 0 ? "اليوم" : `خلال ${daysUntil} أيام`}.`,
        action_type: "dismiss-only",
        action_payload: null,
      });
    }
  }

  // ── 4. Unusual spend anomaly ─────────────────────────────────────────────
  if (allTxs.length >= 5) {
    const amounts = allTxs
      .filter((t) => (t.amount_base ?? t.amount) < 0)
      .map((t) => Math.abs(t.amount_base ?? t.amount));
    const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;

    // Check most recent transaction
    const latestExpense = allTxs.find((t) => (t.amount_base ?? t.amount) < 0);
    if (latestExpense) {
      const latestAmt = Math.abs(latestExpense.amount_base ?? latestExpense.amount);
      if (latestAmt > avg * 3 && latestExpense.date === today) {
        const title = `إنفاق غير معتاد: ${latestExpense.merchant ?? "معاملة"}`;
        if (!(await recentAlertExists(user.id, title, 24))) {
          toGenerate.push({
            type: "recommendation",
            title,
            body: `معاملة بقيمة ${latestAmt.toFixed(0)} ريال أعلى بـ ${Math.round(latestAmt / avg)}× من متوسط إنفاقك اليومي (${avg.toFixed(0)} ريال).`,
            action_type: "navigate",
            action_payload: { route: `/transactions/${latestExpense.id}` },
          });
        }
      }
    }
  }

  // ── 5. Weekly summary (Sundays only) ────────────────────────────────────
  const isSunday = now.getDay() === 0;
  if (isSunday) {
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const weekTxs = allTxs.filter((t) => t.date >= weekStart);
    const weekExpenses = weekTxs
      .filter((t) => (t.amount_base ?? t.amount) < 0)
      .reduce((s, t) => s + Math.abs(t.amount_base ?? t.amount), 0);
    const weekIncome = weekTxs
      .filter((t) => (t.amount_base ?? t.amount) > 0)
      .reduce((s, t) => s + (t.amount_base ?? t.amount), 0);

    const title = "ملخص الأسبوع المالي";
    if (!(await recentAlertExists(user.id, title, 168))) {
      toGenerate.push({
        type: "recommendation",
        title,
        body: `هذا الأسبوع: دخل ${weekIncome.toFixed(0)} ريال، مصروفات ${weekExpenses.toFixed(0)} ريال، صافي ${(weekIncome - weekExpenses).toFixed(0)} ريال. ${weekTxs.length} معاملة.`,
        action_type: "navigate",
        action_payload: { route: "/analytics" },
      });
    }
  }

  // ── Insert all generated alerts ──────────────────────────────────────────
  if (toGenerate.length === 0) {
    return Response.json({ generated: 0, skipped: 0, alerts: [] });
  }

  const { data: inserted, error } = await supabase
    .from("alerts")
    .insert(
      toGenerate.map((a) => ({
        user_id: user.id,
        ...a,
        dismissed: false,
      }))
    )
    .select();

  if (error) {
    console.error("Alert insert error:", error);
    return Response.json({ error: "فشل إنشاء التنبيهات" }, { status: 500 });
  }

  return Response.json({
    generated: inserted?.length ?? 0,
    skipped: toGenerate.length - (inserted?.length ?? 0),
    alerts: inserted,
  });
}
