export const dynamic = "force-dynamic";

import { getRequestUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { strengthenEdges } from "@/lib/knowledge-graph";
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
    const projectId = body.project_id ?? null;
    const now = new Date().toISOString();

    // Chat-originated transactions are always SAR (chatbot extracts amounts in SAR)
    const { data: tx, error: txErr } = await supabase
      .from("transactions")
      .insert({
        user_id: user.id,
        merchant,
        amount,
        currency: "SAR",
        currency_original: "SAR",
        exchange_rate: 1.0,
        amount_base: amount,
        date: now.split("T")[0],
        project_id: projectId,
        status: projectId ? "classified" : "pending",
        confidence_score: projectId ? (card.confidence / 100) : null,
        ai_reasoning: projectId ? `تم التأكيد عبر المحادثة (${card.category})` : null,
        classified_at: projectId ? now : null,
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
      suggestions: card.suggestions, // preserve for display
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

    // Grow the Knowledge Graph: strengthen merchant→category edges
    strengthenEdges(
      user.id,
      tx.id,
      merchant,
      card.category ?? null,
      tx.date
    ).catch((e) => console.error("KG strengthen failed:", e));

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
