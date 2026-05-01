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

export async function DELETE() {
  await getRequestUser();

  const { error } = await supabase
    .from("chat_messages")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // delete all rows

  if (error) {
    console.error("Failed to clear chat messages:", error);
    return Response.json({ error: "فشل مسح المحادثة" }, { status: 500 });
  }

  return Response.json({ success: true });
}
