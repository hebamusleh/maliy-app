export const dynamic = "force-dynamic";

import { getRequestUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { DashboardData } from "@/types/index";

export async function GET() {
  const user = await getRequestUser();
  const userId = user.id;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .split("T")[0];
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    .toISOString()
    .split("T")[0];

  try {
    // Current month transactions
    const { data: txs } = await supabase
      .from("transactions")
      .select("amount, project_id, status")
      .eq("user_id", userId)
      .gte("date", monthStart);

    // Previous month transactions (for change %)
    const { data: prevTxs } = await supabase
      .from("transactions")
      .select("amount")
      .eq("user_id", userId)
      .gte("date", prevMonthStart)
      .lt("date", monthStart)
      .eq("status", "classified");

    // Projects
    const { data: projects } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId);

    // Recent alerts (not dismissed)
    const { data: alerts } = await supabase
      .from("alerts")
      .select("*")
      .eq("user_id", userId)
      .eq("dismissed", false)
      .order("created_at", { ascending: false })
      .limit(2);

    const classified = (txs ?? []).filter((t) => t.status === "classified");
    const income = classified.reduce(
      (s, t) => s + (t.amount > 0 ? t.amount : 0),
      0
    );
    const expenses = classified.reduce(
      (s, t) => s + (t.amount < 0 ? Math.abs(t.amount) : 0),
      0
    );
    const balance = income - expenses;
    const savings = balance * 0.4; // simplified

    const prevBalance = (prevTxs ?? []).reduce((s, t) => s + t.amount, 0);
    const balanceChangePct =
      prevBalance !== 0
        ? Math.round(((balance - prevBalance) / Math.abs(prevBalance)) * 100 * 10) / 10
        : 0;

    const pendingCount = (txs ?? []).filter((t) => t.status === "pending").length;

    // Project summaries
    const projectSummaries = (projects ?? []).map((p) => {
      const ptxs = classified.filter((t) => t.project_id === p.id);
      const spend = ptxs.reduce(
        (s, t) => s + (t.amount < 0 ? Math.abs(t.amount) : 0),
        0
      );
      const budgetUsedPct = p.budget_limit
        ? Math.round((spend / p.budget_limit) * 100 * 10) / 10
        : 0;
      return {
        project: p,
        spend,
        budget_used_pct: budgetUsedPct,
        remaining: p.budget_limit ? Math.max(p.budget_limit - spend, 0) : 0,
        transaction_count: ptxs.length,
      };
    });

    const dashboardData: DashboardData = {
      balance,
      income,
      expenses,
      savings,
      balance_change_pct: balanceChangePct,
      pending_count: pendingCount,
      projects: projectSummaries,
      recent_alerts: alerts ?? [],
    };

    return Response.json(dashboardData);
  } catch (err) {
    console.error("Dashboard error:", err);
    return Response.json({ error: "فشل تحميل البيانات" }, { status: 500 });
  }
}
