export const dynamic = "force-dynamic";

import { supabase } from "@/lib/supabase";

const ANON_USER = "anon-user";

export async function POST() {
  if (process.env.NODE_ENV === "production") {
    return Response.json({ error: "Not available in production" }, { status: 403 });
  }

  // Delete existing anon-user data in dependency order
  await supabase.from("card_links").delete().eq("user_id", ANON_USER);
  await supabase.from("transactions").delete().eq("user_id", ANON_USER);
  await supabase.from("projects").delete().eq("user_id", ANON_USER);

  // Insert 3 projects
  const { data: projects, error: projError } = await supabase
    .from("projects")
    .insert([
      { user_id: ANON_USER, name: "الشخصي",  icon: "🏠", type: "personal",  budget_limit: 3000  },
      { user_id: ANON_USER, name: "عمل",      icon: "💼", type: "business",  budget_limit: 10000 },
      { user_id: ANON_USER, name: "فريلانس",  icon: "💻", type: "freelance", budget_limit: 5000  },
    ])
    .select();

  if (projError || !projects) {
    return Response.json({ error: "فشل إنشاء المشاريع", details: projError?.message }, { status: 500 });
  }

  const [personal, work, freelance] = projects;

  // Helper to build a date string N months ago + day offset
  const date = (monthsAgo: number, day: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() - monthsAgo);
    d.setDate(day);
    return d.toISOString().split("T")[0];
  };

  const txRows = [
    // ── Personal project ──────────────────────────────────────
    { project_id: personal.id, amount: 5000,   merchant: "راتب أكتوبر",        date: date(2, 1),  status: "classified", notes: null },
    { project_id: personal.id, amount: -450,   merchant: "نتفليكس",            date: date(2, 5),  status: "classified", notes: null },
    { project_id: personal.id, amount: -1200,  merchant: "إيجار الشقة",        date: date(2, 7),  status: "classified", notes: null },
    { project_id: personal.id, amount: -320,   merchant: "بقالة العثيم",       date: date(2, 15), status: "classified", notes: null },
    { project_id: personal.id, amount: 5000,   merchant: "راتب نوفمبر",        date: date(1, 1),  status: "classified", notes: null },
    { project_id: personal.id, amount: -450,   merchant: "نتفليكس",            date: date(1, 5),  status: "classified", notes: null },
    { project_id: personal.id, amount: -1200,  merchant: "إيجار الشقة",        date: date(1, 7),  status: "classified", notes: null },
    { project_id: personal.id, amount: -280,   merchant: "مطعم البيك",         date: date(1, 20), status: "classified", notes: null },
    { project_id: personal.id, amount: 5000,   merchant: "راتب ديسمبر",        date: date(0, 1),  status: "classified", notes: null },
    { project_id: personal.id, amount: -520,   merchant: "سبوتيفاي + نتفليكس", date: date(0, 5),  status: "pending",    notes: null },
    { project_id: personal.id, amount: -1200,  merchant: "إيجار الشقة",        date: date(0, 7),  status: "classified", notes: null },

    // ── Work project ──────────────────────────────────────────
    { project_id: work.id, amount: 15000,  merchant: "عميل شركة الرياض",   date: date(2, 3),  status: "classified", notes: null },
    { project_id: work.id, amount: -2400,  merchant: "AWS",                 date: date(2, 8),  status: "classified", notes: null },
    { project_id: work.id, amount: -800,   merchant: "GitHub Enterprise",   date: date(2, 10), status: "classified", notes: null },
    { project_id: work.id, amount: -350,   merchant: "Figma Pro",           date: date(2, 12), status: "classified", notes: null },
    { project_id: work.id, amount: 12000,  merchant: "عميل شركة جدة",      date: date(1, 3),  status: "classified", notes: null },
    { project_id: work.id, amount: -2600,  merchant: "AWS",                 date: date(1, 8),  status: "classified", notes: null },
    { project_id: work.id, amount: -420,   merchant: "Slack Business",      date: date(1, 11), status: "classified", notes: null },
    { project_id: work.id, amount: 18000,  merchant: "عميل شركة الخبر",    date: date(0, 3),  status: "classified", notes: null },
    { project_id: work.id, amount: -2800,  merchant: "AWS",                 date: date(0, 8),  status: "pending",    notes: null },
    { project_id: work.id, amount: -800,   merchant: "GitHub Enterprise",   date: date(0, 10), status: "classified", notes: null },

    // ── Freelance project ─────────────────────────────────────
    { project_id: freelance.id, amount: 3500,  merchant: "مشروع تصميم موقع",  date: date(2, 5),  status: "classified", notes: null },
    { project_id: freelance.id, amount: -200,  merchant: "Adobe CC",          date: date(2, 6),  status: "classified", notes: null },
    { project_id: freelance.id, amount: 2800,  merchant: "مشروع تطوير تطبيق", date: date(1, 5),  status: "classified", notes: null },
    { project_id: freelance.id, amount: -150,  merchant: "Canva Pro",         date: date(1, 6),  status: "classified", notes: null },
    { project_id: freelance.id, amount: -90,   merchant: "Notion Pro",        date: date(1, 9),  status: "classified", notes: null },
    { project_id: freelance.id, amount: 4200,  merchant: "مشروع لوحة تحكم",   date: date(0, 5),  status: "classified", notes: null },
    { project_id: freelance.id, amount: -200,  merchant: "Adobe CC",          date: date(0, 6),  status: "pending",    notes: null },
    { project_id: freelance.id, amount: -90,   merchant: "Notion Pro",        date: date(0, 9),  status: "classified", notes: null },
  ];

  // Insert sample card links with full data
  await supabase.from("card_links").insert([
    {
      user_id: ANON_USER,
      project_id: personal.id,
      last4: "1234",
      cardholder_name: "محمد عبدالله",
      expiry_month: 8,
      expiry_year: 2027,
      bank_name: "الراجحي",
      card_network: "Mada",
      card_type: "debit",
    },
    {
      user_id: ANON_USER,
      project_id: work.id,
      last4: "5678",
      cardholder_name: "محمد عبدالله",
      expiry_month: 3,
      expiry_year: 2026,
      bank_name: "الأهلي",
      card_network: "Visa",
      card_type: "credit",
    },
    {
      user_id: ANON_USER,
      project_id: freelance.id,
      last4: "9012",
      cardholder_name: "محمد عبدالله",
      expiry_month: 11,
      expiry_year: 2028,
      bank_name: "الرياض",
      card_network: "Mastercard",
      card_type: "credit",
    },
  ]);

  const { error: txError } = await supabase.from("transactions").insert(
    txRows.map((t) => ({
      user_id: ANON_USER,
      currency: "SAR",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      ...t,
    }))
  );

  if (txError) {
    return Response.json({ error: "فشل إنشاء المعاملات", details: txError.message }, { status: 500 });
  }

  return Response.json({
    message: "تم إنشاء البيانات التجريبية بنجاح",
    projects: projects.length,
    transactions: txRows.length,
  });
}
