export const dynamic = "force-dynamic";

import { getRequestUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { getExchangeRate, toBaseCurrency, BASE_CURRENCY } from "@/lib/exchange";
import type { Transaction } from "@/types/project";

/**
 * Resolve a project_id from a payment card's last-4 digits.
 * Returns null if no match is found.
 */
async function resolveProjectByCard(
  userId: string,
  last4: string
): Promise<string | null> {
  const { data } = await supabase
    .from("card_links")
    .select("project_id")
    .eq("user_id", userId)
    .eq("last4", last4)
    .limit(1)
    .maybeSingle();
  return data?.project_id ?? null;
}

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

  const currencyOriginal: string = body.currency_original ?? BASE_CURRENCY;
  const exchangeRate = await getExchangeRate(currencyOriginal, body.date);
  const amountBase = toBaseCurrency(Number(body.amount), exchangeRate);

  let projectId: string | null = body.project_id ?? null;
  let classificationSource: "card" | "manual" | "pending" = "pending";
  const now = new Date().toISOString();

  // ── Step 1: Auto-assign via linked card (highest priority, skips AI) ──
  if (body.payment_last4 && !projectId) {
    const cardProject = await resolveProjectByCard(user.id, body.payment_last4);
    if (cardProject) {
      projectId = cardProject;
      classificationSource = "card";
    }
  } else if (projectId) {
    classificationSource = "manual";
  }

  const isClassified = classificationSource !== "pending";

  const { data, error } = await supabase
    .from("transactions")
    .insert({
      user_id: user.id,
      merchant: body.merchant,
      amount: body.amount,
      currency: currencyOriginal,
      currency_original: currencyOriginal,
      exchange_rate: exchangeRate,
      amount_base: amountBase,
      date: body.date,
      transaction_time: body.transaction_time ?? null,
      payment_last4: body.payment_last4 ?? null,
      notes: body.notes ?? null,
      project_id: projectId,
      status: isClassified ? "classified" : "pending",
      confidence_score: classificationSource === "card" ? 1.0 : null,
      ai_reasoning:
        classificationSource === "card"
          ? `تم التصنيف تلقائياً عبر البطاقة المرتبطة (••••${body.payment_last4})`
          : null,
      classified_at: isClassified ? now : null,
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: "فشل إنشاء المعاملة" }, { status: 500 });
  }

  return Response.json({ transaction: data as Transaction }, { status: 201 });
}
