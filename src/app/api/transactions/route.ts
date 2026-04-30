export const dynamic = "force-dynamic";

import { getRequestUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { Transaction } from "@/types/project";

export async function GET(request: Request) {
  const user = await getRequestUser();

  const url = new URL(request.url);
  const projectId = url.searchParams.get("project_id");
  const status = url.searchParams.get("status") ?? "all";
  const search = url.searchParams.get("search") ?? "";
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  const page = parseInt(url.searchParams.get("page") ?? "1");
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 200);
  const offset = (page - 1) * limit;

  let query = supabase
    .from("transactions")
    .select("*, project:projects(id,name,icon,type), category:spending_categories(id,name_ar,icon,color)", {
      count: "exact",
    })
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .order("transaction_time", { ascending: false })
    .range(offset, offset + limit - 1);

  if (projectId) query = query.eq("project_id", projectId);
  if (status !== "all") query = query.eq("status", status);
  if (search) query = query.ilike("merchant", `%${search}%`);
  if (from) query = query.gte("date", from);
  if (to) query = query.lte("date", to);

  const { data, count, error } = await query;
  if (error) {
    return Response.json({ error: "فشل تحميل المعاملات" }, { status: 500 });
  }

  return Response.json({ transactions: data ?? [], total: count ?? 0, page, limit });
}

export async function POST(request: Request) {
  const user = await getRequestUser();

  const body = await request.json();
  if (!body.merchant || body.amount === undefined || !body.date) {
    return Response.json({ error: "حقول مطلوبة ناقصة" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      merchant: body.merchant,
      amount: body.amount,
      currency: "SAR",
      date: body.date,
      transaction_time: body.transaction_time ?? null,
      payment_last4: body.payment_last4 ?? null,
      notes: body.notes ?? null,
      project_id: body.project_id ?? null,
      category_id: body.category_id ?? null,
      status: body.project_id ? "classified" : "pending",
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: "فشل إنشاء المعاملة" }, { status: 500 });
  }

  return Response.json({ transaction: data as Transaction }, { status: 201 });
}
