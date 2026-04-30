export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";

export async function GET() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: messages, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) {
    return Response.json({ error: "فشل تحميل الرسائل" }, { status: 500 });
  }

  return Response.json({ messages: messages ?? [] });
}
