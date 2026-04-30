export const dynamic = "force-dynamic";

import { getRequestUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { learnClassification } from "@/lib/classification";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const user = await getRequestUser();

  const body = await request.json();
  const { project_id, category_id, apply_to_merchant } = body;

  if (!project_id) {
    return Response.json({ error: "project_id مطلوب" }, { status: 400 });
  }

  // Verify project belongs to user
  const { data: project } = await supabase
    .from("projects")
    .select("id")
    .eq("id", project_id)
    .eq("user_id", user.id)
    .single();

  if (!project) {
    return Response.json({ error: "المشروع غير موجود" }, { status: 404 });
  }

  // Get the transaction to find merchant
  const { data: tx } = await supabase
    .from("transactions")
    .select("id, merchant")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!tx) {
    return Response.json({ error: "المعاملة غير موجودة" }, { status: 404 });
  }

  const now = new Date().toISOString();

  // Classify this transaction
  await supabase
    .from("transactions")
    .update({
      project_id,
      category_id: category_id ?? null,
      status: "classified",
      classified_at: now,
      updated_at: now,
    })
    .eq("id", id)
    .eq("user_id", user.id);

  let appliedCount = 1;
  let ruleCreated = false;

  // Apply to merchant
  if (apply_to_merchant && tx.merchant) {
    const { data: sameMerchant } = await supabase
      .from("transactions")
      .select("id")
      .eq("user_id", user.id)
      .eq("status", "pending")
      .ilike("merchant", tx.merchant)
      .neq("id", id);

    if (sameMerchant?.length) {
      await supabase
        .from("transactions")
        .update({
          project_id,
          category_id: category_id ?? null,
          status: "classified",
          classified_at: now,
          updated_at: now,
        })
        .in("id", sameMerchant.map((t) => t.id));

      appliedCount += sameMerchant.length;
    }

    // Learn the rule
    await learnClassification(user.id, tx.merchant, project_id, category_id);
    ruleCreated = true;
  }

  const { data: updated } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", id)
    .single();

  return Response.json({
    transaction: updated,
    applied_count: appliedCount,
    rule_created: ruleCreated,
  });
}
