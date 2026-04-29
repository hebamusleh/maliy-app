import { supabase } from "@/lib/supabase";
import type { Debt, DebtSummary } from "@/types/index";

export async function GET() {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: debts, error } = await supabase
    .from("debts")
    .select("*")
    .eq("user_id", user.id)
    .order("is_urgent", { ascending: false })
    .order("due_date", { ascending: true, nullsFirst: false });

  if (error) {
    return Response.json({ error: "فشل تحميل الديون" }, { status: 500 });
  }

  const rows = (debts ?? []) as Debt[];
  const total_owed_by_me = rows
    .filter((d) => d.direction === "owed_by_me")
    .reduce((s, d) => s + d.remaining_amount, 0);
  const total_owed_to_me = rows
    .filter((d) => d.direction === "owed_to_me")
    .reduce((s, d) => s + d.remaining_amount, 0);

  const summary: DebtSummary = {
    total_owed_by_me,
    total_owed_to_me,
    net: total_owed_to_me - total_owed_by_me,
    monthly_repayment_rate: 0, // can be refined with payment history
  };

  return Response.json({ debts: rows, summary });
}

export async function POST(request: Request) {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError || !user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { debtor_name, direction, total_amount, due_date, notes, is_interest_free } = body;

  if (!debtor_name || !direction || total_amount === undefined) {
    return Response.json({ error: "حقول مطلوبة ناقصة" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("debts")
    .insert({
      user_id: user.id,
      debtor_name,
      direction,
      total_amount,
      remaining_amount: total_amount,
      due_date: due_date ?? null,
      notes: notes ?? null,
      is_urgent: false,
      is_interest_free: is_interest_free ?? true,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: "فشل إنشاء الدين" }, { status: 500 });
  }

  return Response.json({ debt: data as Debt }, { status: 201 });
}
