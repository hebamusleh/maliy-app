export const dynamic = "force-dynamic";

import { getRequestUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { TxReceiptCard } from "@/types/index";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getRequestUser();
  const { id } = await params;

  const body = await request.json() as {
    status: "confirmed" | "deleted";
    project_id?: string;
    merchant?: string;
    amount?: number;
  };

  if (!body.status || !["confirmed", "deleted"].includes(body.status)) {
    return Response.json({ error: "قيمة الحالة غير صحيحة" }, { status: 400 });
  }

  // Fetch the message
  const { data: msg, error: fetchErr } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchErr || !msg) {
    return Response.json({ error: "الرسالة غير موجودة" }, { status: 404 });
  }

  const card = msg.rich_card as TxReceiptCard | null;
  if (!card || card.type !== "tx_receipt") {
    return Response.json({ error: "لا توجد بطاقة إيصال لهذه الرسالة" }, { status: 400 });
  }

  if (card.status !== "pending") {
    return Response.json({ error: "تم تنفيذ الإجراء مسبقاً" }, { status: 409 });
  }

  if (body.status === "confirmed") {
    // Create the transaction
    const merchant = body.merchant ?? card.merchant;
    const amount = body.amount ?? card.amount;
    const { data: tx, error: txErr } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        merchant,
        amount,
        currency: "SAR",
        date: new Date().toISOString().split("T")[0],
        project_id: body.project_id ?? null,
        status: body.project_id ? "classified" : "pending",
      })
      .select()
      .single();

    if (txErr || !tx) {
      return Response.json({ error: "فشل إنشاء المعاملة" }, { status: 500 });
    }

    const updatedCard: TxReceiptCard = {
      ...card,
      merchant,
      amount,
      transaction_id: tx.id,
      status: "confirmed",
    };

    const { data: updatedMsg, error: updateErr } = await supabase
      .from("chat_messages")
      .update({ rich_card: updatedCard })
      .eq("id", id)
      .select()
      .single();

    if (updateErr) {
      return Response.json({ error: "فشل تحديث البطاقة" }, { status: 500 });
    }

    return Response.json({ message: updatedMsg, transaction: tx });
  }

  // status === "deleted"
  const updatedCard: TxReceiptCard = { ...card, status: "deleted" };
  const { data: updatedMsg, error: updateErr } = await supabase
    .from("chat_messages")
    .update({ rich_card: updatedCard })
    .eq("id", id)
    .select()
    .single();

  if (updateErr) {
    return Response.json({ error: "فشل تحديث البطاقة" }, { status: 500 });
  }

  return Response.json({ message: updatedMsg });
}
