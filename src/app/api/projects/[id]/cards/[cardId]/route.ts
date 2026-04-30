export const dynamic = "force-dynamic";

import { getRequestUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; cardId: string }> }
) {
  const { id: projectId, cardId } = await params;
  const user = await getRequestUser();

  const { error } = await supabase
    .from("card_links")
    .delete()
    .eq("id", cardId)
    .eq("project_id", projectId)
    .eq("user_id", user.id);

  if (error) {
    return Response.json({ error: "فشل حذف البطاقة" }, { status: 500 });
  }

  return new Response(null, { status: 204 });
}
