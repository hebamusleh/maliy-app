export const dynamic = "force-dynamic";

import { getRequestUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

const VALID_NETWORKS = ["Visa", "Mastercard", "Mada", "Amex", "Other"] as const;
const VALID_TYPES = ["credit", "debit"] as const;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getRequestUser();
    const projectId = (await params).id;
    const body = await request.json();
    const { last4, cardholder_name, expiry_month, expiry_year, bank_name, card_network, card_type } = body;

    if (!last4 || !/^\d{4}$/.test(last4)) {
      return NextResponse.json({ error: "آخر 4 أرقام غير صالحة" }, { status: 400 });
    }
    if (card_network && !VALID_NETWORKS.includes(card_network)) {
      return NextResponse.json({ error: "شبكة بطاقة غير صالحة" }, { status: 400 });
    }
    if (card_type && !VALID_TYPES.includes(card_type)) {
      return NextResponse.json({ error: "نوع بطاقة غير صالح" }, { status: 400 });
    }
    if (expiry_month && (expiry_month < 1 || expiry_month > 12)) {
      return NextResponse.json({ error: "شهر انتهاء صلاحية غير صالح" }, { status: 400 });
    }
    if (expiry_year && expiry_year < 2020) {
      return NextResponse.json({ error: "سنة انتهاء صلاحية غير صالحة" }, { status: 400 });
    }

    // Check project belongs to user
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "المشروع غير موجود" }, { status: 404 });
    }

    // Check for exact duplicate (same project + same last4)
    const { data: existingLink } = await supabase
      .from("card_links")
      .select("id")
      .eq("user_id", user.id)
      .eq("project_id", projectId)
      .eq("last4", last4)
      .maybeSingle();

    if (existingLink) {
      return NextResponse.json({ error: "البطاقة مرتبطة بهذا المشروع مسبقاً" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("card_links")
      .insert({
        user_id: user.id,
        project_id: projectId,
        last4,
        cardholder_name: cardholder_name || null,
        expiry_month: expiry_month || null,
        expiry_year: expiry_year || null,
        bank_name: bank_name || null,
        card_network: card_network || null,
        card_type: card_type || "credit",
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "فشل ربط البطاقة" }, { status: 500 });
    }

    return NextResponse.json({ cardLink: data }, { status: 201 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 });
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getRequestUser();
    const projectId = (await params).id;

    const { data, error } = await supabase
      .from("card_links")
      .select("*")
      .eq("user_id", user.id)
      .eq("project_id", projectId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json({ error: "فشل تحميل البطاقات" }, { status: 500 });
    }

    return NextResponse.json({ cardLinks: data });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 });
  }
}
