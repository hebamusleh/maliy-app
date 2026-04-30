export const dynamic = "force-dynamic";

import { getRequestUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { CreateProjectForm } from "@/types/project";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const user = await getRequestUser();

    const body: CreateProjectForm = await request.json();

    // Validate required fields
    if (!body.name || !body.icon || !body.type) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("projects")
      .insert({
        user_id: user.id,
        name: body.name,
        icon: body.icon,
        type: body.type,
        budget_limit: body.budget_limit,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to create project" },
        { status: 500 },
      );
    }

    return NextResponse.json({ project: data }, { status: 201 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function GET() {
  try {
    const user = await getRequestUser();

    const { data: projects, error } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch projects" },
        { status: 500 },
      );
    }

    // Compute per-project spend from transactions
    const { data: spendRows } = await supabase
      .from("transactions")
      .select("project_id, amount")
      .eq("user_id", user.id)
      .lt("amount", 0);

    const spendMap = new Map<string, number>();
    for (const row of spendRows ?? []) {
      if (!row.project_id) continue;
      spendMap.set(row.project_id, (spendMap.get(row.project_id) ?? 0) + Math.abs(row.amount));
    }

    const enriched = (projects ?? []).map((p) => {
      const spend = spendMap.get(p.id) ?? 0;
      const budget_used_pct = p.budget_limit
        ? Math.round((spend / p.budget_limit) * 1000) / 10
        : null;
      return { ...p, spend, budget_used_pct };
    });

    return NextResponse.json({ projects: enriched });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
