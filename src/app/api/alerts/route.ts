import { supabase } from "@/lib/supabase";
import type { Alert, AlertCounts } from "@/types/index";

export async function GET(request: Request) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const typeFilter = url.searchParams.get("type");
  const showDismissed = url.searchParams.get("dismissed") === "true";

  let query = supabase
    .from("alerts")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  if (!showDismissed) query = query.eq("dismissed", false);
  if (typeFilter) query = query.eq("type", typeFilter);

  const { data: alerts, error } = await query;
  if (error) {
    return Response.json({ error: "فشل تحميل التنبيهات" }, { status: 500 });
  }

  // Compute counts
  const { data: allAlerts } = await supabase
    .from("alerts")
    .select("type")
    .eq("user_id", user.id)
    .eq("dismissed", false);

  const rows = allAlerts ?? [];
  const counts: AlertCounts = {
    all: rows.length,
    urgent: rows.filter((a) => a.type === "urgent").length,
    recommendation: rows.filter((a) => a.type === "recommendation").length,
    reminder: rows.filter((a) => a.type === "reminder").length,
    achievement: rows.filter((a) => a.type === "achievement").length,
  };

  return Response.json({ alerts: alerts as Alert[], counts });
}
