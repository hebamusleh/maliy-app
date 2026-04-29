import { supabase } from "./supabase";
import type { ForecastSnapshot } from "@/types/index";

/**
 * Monte Carlo–style forecast using last 90 days of transaction data.
 * Runs 200 simulations to derive pessimistic/likely/optimistic scenarios.
 */
export async function generateForecast(
  userId: string,
  horizonDays: 7 | 30 | 90
): Promise<ForecastSnapshot> {
  const now = new Date();
  const lookback = new Date(now);
  lookback.setDate(lookback.getDate() - 90);

  // Fetch last 90 days of classified transactions
  const { data: txs } = await supabase
    .from("transactions")
    .select("amount, date")
    .eq("user_id", userId)
    .gte("date", lookback.toISOString().slice(0, 10))
    .order("date", { ascending: true });

  const rows = txs ?? [];

  // Group by day for daily statistics
  const dayMap = new Map<string, number>();
  for (const tx of rows) {
    dayMap.set(tx.date, (dayMap.get(tx.date) ?? 0) + tx.amount);
  }

  const dailyAmounts = Array.from(dayMap.values());
  const n = dailyAmounts.length || 1;

  const mean = dailyAmounts.reduce((s, v) => s + v, 0) / n;
  const variance =
    dailyAmounts.reduce((s, v) => s + (v - mean) ** 2, 0) / n;
  const stddev = Math.sqrt(variance);

  // Current balance approximation (sum of all transactions)
  const { data: allTxs } = await supabase
    .from("transactions")
    .select("amount")
    .eq("user_id", userId);

  const currentBalance = (allTxs ?? []).reduce((s, t) => s + t.amount, 0);

  // Run Monte Carlo simulations
  const SIMULATIONS = 200;
  const endBalances: number[] = [];

  for (let sim = 0; sim < SIMULATIONS; sim++) {
    let balance = currentBalance;
    for (let d = 0; d < horizonDays; d++) {
      // Box-Muller normal random
      const u1 = Math.random() || 1e-10;
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      balance += mean + stddev * z;
    }
    endBalances.push(balance);
  }

  endBalances.sort((a, b) => a - b);
  const pessimistic = endBalances[Math.floor(SIMULATIONS * 0.1)];
  const likely = endBalances[Math.floor(SIMULATIONS * 0.5)];
  const optimistic = endBalances[Math.floor(SIMULATIONS * 0.9)];

  // Build daily_balances for the likely path (simple daily mean)
  const daily_balances: Array<{ date: string; balance: number }> = [];
  let running = currentBalance;
  for (let d = 0; d < horizonDays; d++) {
    const date = new Date(now);
    date.setDate(date.getDate() + d);
    running += mean;
    daily_balances.push({ date: date.toISOString().slice(0, 10), balance: Math.round(running) });
  }

  // Identify danger zones (where likely balance < 0)
  const danger_zones: ForecastSnapshot["danger_zones"] = [];
  let inDanger = false;
  let dangerStart = "";
  for (const { date, balance } of daily_balances) {
    if (balance < 0 && !inDanger) {
      inDanger = true;
      dangerStart = date;
    } else if (balance >= 0 && inDanger) {
      inDanger = false;
      danger_zones!.push({
        start_date: dangerStart,
        end_date: date,
        min_balance: Math.min(...daily_balances.filter((d) => d.date >= dangerStart && d.date <= date).map((d) => d.balance)),
      });
    }
  }
  if (inDanger) {
    const lastDate = daily_balances[daily_balances.length - 1]?.date ?? now.toISOString().slice(0, 10);
    danger_zones!.push({
      start_date: dangerStart,
      end_date: lastDate,
      min_balance: Math.min(...daily_balances.filter((d) => d.date >= dangerStart).map((d) => d.balance)),
    });
  }

  const snapshot: Omit<ForecastSnapshot, "id" | "generated_at"> = {
    user_id: userId,
    horizon_days: horizonDays,
    pessimistic: Math.round(pessimistic),
    likely: Math.round(likely),
    optimistic: Math.round(optimistic),
    daily_balances,
    danger_zones: danger_zones.length ? danger_zones : null,
    upcoming_events: null,
  };

  // Persist to DB
  const { data: saved } = await supabase
    .from("forecast_snapshots")
    .insert({ ...snapshot, generated_at: now.toISOString() })
    .select()
    .single();

  return saved as ForecastSnapshot ?? { ...snapshot, id: "local", generated_at: now.toISOString() };
}
