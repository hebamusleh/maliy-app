import { supabase } from "@/lib/supabase";

export async function POST(
  request: Request,
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

  const body = await request.json();
  const { amount } = body as { amount: number };

  if (!amount || amount <= 0) {
    return Response.json({ error: "مبلغ الدفعة غير صالح" }, { status: 400 });
  }

  // Fetch current debt
  const { data: debt, error: fetchError } = await supabase
    .from("debts")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !debt) {
    return Response.json({ error: "الدين غير موجود" }, { status: 404 });
  }

  const newRemaining = Math.max(debt.remaining_amount - amount, 0);
  const now = new Date().toISOString();

  // Update debt remaining amount
  const { data: updatedDebt, error: updateError } = await supabase
    .from("debts")
    .update({ remaining_amount: newRemaining, updated_at: now })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (updateError) {
    return Response.json({ error: "فشل تسجيل الدفعة" }, { status: 500 });
  }

  // Create corresponding transaction record
  const txAmount = debt.direction === "owed_by_me" ? -amount : amount;
  const { data: transaction } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      project_id: null,
      amount: txAmount,
      currency: "SAR",
      merchant: debt.debtor_name,
      date: now.split("T")[0],
      status: "classified",
      notes: `دفعة دين: ${debt.debtor_name}`,
      created_at: now,
      updated_at: now,
    })
    .select()
    .single();

  return Response.json({ debt: updatedDebt, transaction });
}
