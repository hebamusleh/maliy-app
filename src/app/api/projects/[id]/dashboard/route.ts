import {
  calculateProjectStats,
  generateProjectInsights,
} from "@/lib/project-stats";
import { supabase } from "@/lib/supabase";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const projectId = (await params).id;

    // Get project
    const { data: project, error: projectError } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", user.id)
      .single();

    if (projectError || !project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Get transactions for this project
    const { data: transactions, error: transactionsError } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .eq("project_id", projectId)
      .order("date", { ascending: false });

    if (transactionsError) {
      console.error("Database error:", transactionsError);
      return NextResponse.json(
        { error: "Failed to fetch transactions" },
        { status: 500 },
      );
    }

    // Calculate stats and insights
    const stats = calculateProjectStats(transactions || []);
    const insights = generateProjectInsights(stats, transactions || []);

    return NextResponse.json({
      project,
      stats,
      recent_transactions: transactions?.slice(0, 10) || [], // Last 10 transactions
      insights,
    });
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
