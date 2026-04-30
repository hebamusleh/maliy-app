export const dynamic = "force-dynamic";

import { getRequestUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET() {
  const user = await getRequestUser();

  const { data: messages, error } = await supabase
    .from("chat_messages")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(50);

  if (error) {
    console.error("Database error in chat/messages:", error);
    return Response.json({ error: "فشل تحميل الرسائل", details: error }, { status: 500 });
  }

  return Response.json({ messages: messages ?? [] });
}
