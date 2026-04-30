import { NextRequest } from "next/server";
import { getRequestUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const user = await getRequestUser();

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