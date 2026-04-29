import { supabase } from "@/lib/supabase";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { error } = await supabase
    .from("alerts")
    .update({ dismissed: true })
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return Response.json({ error: "فشل رفض التنبيه" }, { status: 500 });
  }

  return Response.json({ dismissed: true });
}
