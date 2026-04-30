export const dynamic = "force-dynamic";

import { getRequestUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getRequestUser();

    const { data, error } = await supabase
      .from("projects")
      .select("*")
      .eq("id", (await params).id)
      .eq("user_id", user.id)
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch project" },
        { status: 500 },
      );
    }

    if (!data) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json({ project: data });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getRequestUser();
  const { id } = await params;
  const body = await request.json();

  const allowed: Record<string, unknown> = {};
  if (body.name !== undefined) allowed.name = String(body.name).trim();
  if (body.icon !== undefined) allowed.icon = String(body.icon);
  if (body.type !== undefined) allowed.type = body.type;
  if (body.budget_limit !== undefined)
    allowed.budget_limit = body.budget_limit === null ? null : Number(body.budget_limit);

  if (Object.keys(allowed).length === 0) {
    return NextResponse.json({ error: "لا توجد حقول للتحديث" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("projects")
    .update({ ...allowed, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "فشل تحديث المشروع" }, { status: 500 });
  }

  return NextResponse.json({ project: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getRequestUser();
  const { id } = await params;

  // Step 1: Unassign transactions
  await supabase
    .from("transactions")
    .update({ project_id: null })
    .eq("project_id", id)
    .eq("user_id", user.id);

  // Step 2: Delete card links
  await supabase
    .from("card_links")
    .delete()
    .eq("project_id", id)
    .eq("user_id", user.id);

  // Step 3: Delete the project
  const { error } = await supabase
    .from("projects")
    .delete()
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: "فشل حذف المشروع" }, { status: 500 });
  }

  return NextResponse.json({ message: "تم حذف المشروع" });
}
