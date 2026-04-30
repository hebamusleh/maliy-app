import { getRequestUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

export async function GET(request: Request) {
  const user = await getRequestUser();

  const url = new URL(request.url);
  const projectId = url.searchParams.get("project_id");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  let query = supabase
    .from("transactions")
    .select("*, project:projects(id,name), category:spending_categories(id,name_ar)")
    .eq("user_id", user.id)
    .order("date", { ascending: false })
    .order("transaction_time", { ascending: false })
    .limit(1000);

  if (projectId) query = query.eq("project_id", projectId);
  if (from) query = query.gte("date", from);
  if (to) query = query.lte("date", to);

  const { data, error } = await query;
  if (error) {
    return Response.json({ error: "فشل تصدير المعاملات" }, { status: 500 });
  }

  const rows = data ?? [];

  // Build CSV
  const headers = [
    "التاريخ",
    "الوقت",
    "الجهة",
    "المبلغ",
    "العملة",
    "المشروع",
    "الفئة",
    "الحالة",
    "آخر 4 بطاقة",
    "ملاحظات",
  ];

  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    if (s.includes(",") || s.includes('"') || s.includes("\n")) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };

  const lines = [
    headers.join(","),
    ...rows.map((tx) =>
      [
        tx.date,
        tx.transaction_time ?? "",
        tx.merchant ?? "",
        tx.amount,
        tx.currency,
        (tx.project as { name?: string } | null)?.name ?? "",
        (tx.category as { name_ar?: string } | null)?.name_ar ?? "",
        tx.status,
        tx.payment_last4 ?? "",
        tx.notes ?? "",
      ]
        .map(escape)
        .join(",")
    ),
  ];

  const csv = "\uFEFF" + lines.join("\r\n"); // BOM for Excel Arabic support

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="maliy-transactions-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
