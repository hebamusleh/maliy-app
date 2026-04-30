export const dynamic = "force-dynamic";

import { getRequestUser } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const user = await getRequestUser();
    const projectId = (await params).id;
    const body = await request.json();
    const { last4 } = body;

    // Validate input
    if (!last4 || !/^\d{4}$/.test(last4)) {
      return NextResponse.json(
        { error: "Invalid card number" },
        { status: 400 },
      );
    }

    // Check if project exists and belongs to user
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("id")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Check for exact duplicate (same project + same last4)
    const { data: existingLink, error: linkError } = await supabase
      .from("card_links")
      .select("id")
      .eq("user_id", user.id)
      .eq("project_id", projectId)
      .eq("last4", last4)
      .maybeSingle();

    if (linkError) {
      console.error("Database error:", linkError);
      return NextResponse.json(
        { error: "Failed to check existing links" },
        { status: 500 },
      );
    }

    if (existingLink) {
      return NextResponse.json(
        { error: "Card already linked to this project" },
        { status: 400 },
      );
    }

    // Create the link
    const { data, error } = await supabase
      .from("card_links")
      .insert({
        user_id: user.id,
        project_id: projectId,
        last4,
      })
      .select()
      .single();

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to link card" },
        { status: 500 },
      );
    }

    return NextResponse.json({ cardLink: data }, { status: 201 });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
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
      .eq("project_id", projectId);

    if (error) {
      console.error("Database error:", error);
      return NextResponse.json(
        { error: "Failed to fetch card links" },
        { status: 500 },
      );
    }

    return NextResponse.json({ cardLinks: data });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
