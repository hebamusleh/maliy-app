export const dynamic = "force-dynamic";

import { getRequestUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { generateForecast } from "@/lib/forecast";
import type { ForecastSnapshot } from "@/types/index";

export async function GET(request: Request) {
  const user = await getRequestUser();

  const url = new URL(request.url);
  const horizonParam = parseInt(url.searchParams.get("horizon") ?? "30");
  const horizon = ([7, 30, 90].includes(horizonParam) ? horizonParam : 30) as 7 | 30 | 90;

  // Check for a recent snapshot (within last 6 hours)
  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();
  const { data: cached } = await supabase
    .from("forecast_snapshots")
    .select("*")
    .eq("user_id", user.id)
    .eq("horizon_days", horizon)
    .gte("generated_at", sixHoursAgo)
    .order("generated_at", { ascending: false })
    .limit(1)
    .single();

  if (cached) {
    return Response.json(cached as ForecastSnapshot);
  }

  // Generate fresh forecast
  const snapshot = await generateForecast(user.id, horizon);
  return Response.json(snapshot);
}
