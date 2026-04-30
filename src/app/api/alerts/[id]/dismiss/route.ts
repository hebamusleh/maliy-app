import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const { error } = await supabase
    .from("alerts")
    .update({ dismissed: true })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return Response.json(
      { error: "فشل رفض التنبيه" },
      { status: 500 }
    );
  }

  return Response.json({ dismissed: true });
}