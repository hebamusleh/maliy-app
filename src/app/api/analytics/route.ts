import { supabase } from "@/lib/supabase";
import type { AnalyticsData } from "@/types/index";

export async function GET(request: Request) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const monthParam = url.searchParams.get("month"); // YYYY-MM

  // Default to current month
  const now = new Date();
  const year = monthParam ? parseInt(monthParam.split("-")[0]) : now.getFullYear();
  const month = monthParam ? parseInt(monthParam.split("-")[1]) : now.getMonth() + 1;
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;
  const nextMonth = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2, "0")}-01`;

  // Previous month for comparisons
  const prevYear = month === 1 ? year - 1 : year;
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevMonthStart = `${prevYear}-${String(prevMonth).padStart(2, "0")}-01`;

  // Fetch current month transactions
  const { data: txs } = await supabase
    .from("transactions")
    .select("*, project:projects(id,name,icon,type), category:spending_categories(id,name_ar,icon,color)")
    .eq("user_id", user.id)
    .gte("date", monthStart)
    .lt("date", nextMonth)
    .order("date", { ascending: true });

  // Fetch previous month
  const { data: prevTxs } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_id", user.id)
    .gte("date", prevMonthStart)
    .lt("date", monthStart);

  const rows = txs ?? [];
  const prevRows = prevTxs ?? [];

  const income = rows.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const expenses = Math.abs(rows.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0));
  const prevIncome = prevRows.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const prevExpenses = Math.abs(prevRows.filter((t) => t.amount < 0).reduce((s, t) => s + t.amount, 0));

  const daysInMonth = new Date(year, month, 0).getDate();
  const daily_average = expenses / daysInMonth;
  const savings_rate = income > 0 ? (income - expenses) / income : 0;

  const income_change_pct = prevIncome > 0 ? ((income - prevIncome) / prevIncome) * 100 : 0;
  const expenses_change_pct = prevExpenses > 0 ? ((expenses - prevExpenses) / prevExpenses) * 100 : 0;

  // Category breakdown
  const catMap = new Map<string, { category: { id: string; name_ar: string; icon: string; color: string }; amount: number }>();
  for (const tx of rows) {
    if (tx.amount >= 0) continue; // only expenses
    const cat = tx.category as { id: string; name_ar: string; icon: string; color: string } | null;
    if (!cat) continue;
    const existing = catMap.get(cat.id);
    if (existing) {
      existing.amount += Math.abs(tx.amount);
    } else {
      catMap.set(cat.id, { category: cat, amount: Math.abs(tx.amount) });
    }
  }
  const categories = Array.from(catMap.values())
    .sort((a, b) => b.amount - a.amount)
    .map((c) => ({ ...c, pct: expenses > 0 ? (c.amount / expenses) * 100 : 0 }));

  // Project distribution
  const projMap = new Map<string, { project: { id: string; name: string; icon: string; type: string }; amount: number }>();
  for (const tx of rows) {
    if (tx.amount >= 0) continue;
    const proj = tx.project as { id: string; name: string; icon: string; type: string } | null;
    if (!proj) continue;
    const existing = projMap.get(proj.id);
    if (existing) {
      existing.amount += Math.abs(tx.amount);
    } else {
      projMap.set(proj.id, { project: proj, amount: Math.abs(tx.amount) });
    }
  }
  const project_distribution = Array.from(projMap.values())
    .sort((a, b) => b.amount - a.amount)
    .map((p) => ({ ...p, pct: expenses > 0 ? (p.amount / expenses) * 100 : 0 }));

  // Daily spend
  const dayMap = new Map<string, number>();
  for (const tx of rows) {
    if (tx.amount >= 0) continue;
    const d = tx.date;
    dayMap.set(d, (dayMap.get(d) ?? 0) + Math.abs(tx.amount));
  }
  const daily_spend = Array.from(dayMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, amount]) => ({ date, amount }));

  const result: AnalyticsData = {
    income,
    expenses,
    daily_average,
    savings_rate,
    income_change_pct,
    expenses_change_pct,
    categories,
    project_distribution,
    daily_spend,
  };

  return Response.json(result);
}
