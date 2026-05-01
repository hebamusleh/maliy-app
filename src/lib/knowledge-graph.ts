/**
 * Knowledge Graph — core graph operations for ماليّ
 *
 * Nodes: Merchant, Category (spending_categories), TimePattern, BehavioralPattern
 * Edges: merchant_category (weight), time_patterns, transaction_merchant
 *
 * Every confirmed transaction grows the graph.
 * The graph feeds the RAG context builder (rag-context.ts).
 */

import { supabase } from "./supabase";

// ─── Types ───────────────────────────────────────────────────

export interface MerchantNode {
  id: string;
  name: string;
  normalized_name: string;
  aliases: string[];
}

export interface CategoryEdge {
  category_id: string;
  name_ar: string;
  name_en: string;
  weight: number;
}

export interface TimePatternEdge {
  merchant_id: string;
  day_of_week: number | null;
  month_day: number | null;
  hour_start: number | null;
  hour_end: number | null;
  occurrence_count: number;
  last_seen: string;
}

export interface GraphContext {
  merchant: MerchantNode | null;
  topCategories: CategoryEdge[];
  timePattern: TimePatternEdge | null;
  similarTransactions: Array<{
    merchant: string;
    amount: number;
    project_id: string | null;
    date: string;
    category_name_ar: string | null;
  }>;
}

// ─── Helpers ────────────────────────────────────────────────

function normalizeMerchant(name: string): string {
  return name
    .toLowerCase()
    .trim()
    // strip common Arabic/English noise words
    .replace(/\b(the|al|el|شركة|مؤسسة|متجر|محل)\b/g, "")
    .replace(/[^\w\u0600-\u06FF]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// ─── Node operations ────────────────────────────────────────

/**
 * Find or create a Merchant node by name.
 * Matches on normalized_name OR aliases array.
 */
export async function upsertMerchant(name: string): Promise<MerchantNode | null> {
  const normalized = normalizeMerchant(name);
  if (!normalized) return null;

  // Try exact normalized match first
  const { data: existing } = await supabase
    .from("kg_merchants")
    .select("id, name, normalized_name, aliases")
    .eq("normalized_name", normalized)
    .single();

  if (existing) return existing as MerchantNode;

  // Try alias match (merchant might be stored under a slightly different name)
  const { data: aliasMatch } = await supabase
    .from("kg_merchants")
    .select("id, name, normalized_name, aliases")
    .contains("aliases", [normalized])
    .single();

  if (aliasMatch) return aliasMatch as MerchantNode;

  // Create new merchant node
  const { data: created, error } = await supabase
    .from("kg_merchants")
    .insert({ name: name.trim(), normalized_name: normalized, aliases: [] })
    .select("id, name, normalized_name, aliases")
    .single();

  if (error || !created) return null;
  return created as MerchantNode;
}

/**
 * Get a merchant's top categories by edge weight for this user.
 */
export async function getMerchantTopCategories(
  userId: string,
  merchantId: string,
  limit = 3
): Promise<CategoryEdge[]> {
  const { data } = await supabase
    .from("kg_merchant_category")
    .select(`
      category_id,
      weight,
      spending_categories ( name_ar, name_en )
    `)
    .eq("user_id", userId)
    .eq("merchant_id", merchantId)
    .order("weight", { ascending: false })
    .limit(limit);

  if (!data) return [];

  return data.map((row: {
    category_id: string;
    weight: number;
    spending_categories: { name_ar: string; name_en: string } | null;
  }) => ({
    category_id: row.category_id,
    name_ar: row.spending_categories?.name_ar ?? "",
    name_en: row.spending_categories?.name_en ?? "",
    weight: row.weight,
  }));
}

/**
 * Get recurring time pattern for a merchant (if any).
 */
export async function getMerchantTimePattern(
  userId: string,
  merchantId: string
): Promise<TimePatternEdge | null> {
  const { data } = await supabase
    .from("kg_time_patterns")
    .select("merchant_id, day_of_week, month_day, hour_start, hour_end, occurrence_count, last_seen")
    .eq("user_id", userId)
    .eq("merchant_id", merchantId)
    .order("occurrence_count", { ascending: false })
    .limit(1)
    .single();

  return (data as TimePatternEdge | null) ?? null;
}

/**
 * Find recent similar transactions by merchant or category.
 * Used to provide "what project did the user put these in?" context.
 */
export async function getSimilarTransactions(
  userId: string,
  merchantId: string | null,
  categoryNameAr: string | null,
  limit = 5
): Promise<GraphContext["similarTransactions"]> {
  // Query by merchant link first (most precise)
  if (merchantId) {
    const { data: byMerchant } = await supabase
      .from("kg_transaction_merchant")
      .select(`
        merchant_id,
        transactions!inner (
          id, merchant, amount, project_id, date,
          spending_categories ( name_ar )
        )
      `)
      .eq("merchant_id", merchantId)
      .eq("transactions.user_id", userId)
      .eq("transactions.status", "classified")
      .order("transactions.date", { ascending: false })
      .limit(limit);

    if (byMerchant && byMerchant.length >= 2) {
      return byMerchant.map((row: {
        transactions: {
          merchant: string;
          amount: number;
          project_id: string | null;
          date: string;
          spending_categories: { name_ar: string } | null;
        };
      }) => ({
        merchant: row.transactions.merchant,
        amount: row.transactions.amount,
        project_id: row.transactions.project_id,
        date: row.transactions.date,
        category_name_ar: row.transactions.spending_categories?.name_ar ?? null,
      }));
    }
  }

  // Fallback: query by category name similarity
  if (categoryNameAr) {
    const { data: byCat } = await supabase
      .from("transactions")
      .select(`
        merchant, amount, project_id, date,
        spending_categories ( name_ar )
      `)
      .eq("user_id", userId)
      .eq("status", "classified")
      .not("project_id", "is", null)
      .ilike("spending_categories.name_ar", `%${categoryNameAr}%`)
      .order("date", { ascending: false })
      .limit(limit);

    if (byCat) {
      return byCat.map((row: {
        merchant: string;
        amount: number;
        project_id: string | null;
        date: string;
        spending_categories: { name_ar: string } | null;
      }) => ({
        merchant: row.merchant,
        amount: row.amount,
        project_id: row.project_id,
        date: row.date,
        category_name_ar: row.spending_categories?.name_ar ?? null,
      }));
    }
  }

  return [];
}

// ─── Edge operations (graph growth) ─────────────────────────

/**
 * Called after a user confirms a transaction.
 * Strengthens merchant→category edge and updates time pattern.
 */
export async function strengthenEdges(
  userId: string,
  transactionId: string,
  merchantName: string,
  categoryNameAr: string | null,
  txDate: string
): Promise<void> {
  const merchant = await upsertMerchant(merchantName);
  if (!merchant) return;

  // Link transaction to merchant node
  await supabase
    .from("kg_transaction_merchant")
    .upsert(
      { transaction_id: transactionId, merchant_id: merchant.id },
      { onConflict: "transaction_id,merchant_id", ignoreDuplicates: true }
    );

  // Strengthen merchant→category edge if we have a category
  if (categoryNameAr) {
    const { data: cat } = await supabase
      .from("spending_categories")
      .select("id")
      .eq("name_ar", categoryNameAr)
      .single();

    if (cat) {
      const { data: existingEdge } = await supabase
        .from("kg_merchant_category")
        .select("id, weight")
        .eq("user_id", userId)
        .eq("merchant_id", merchant.id)
        .eq("category_id", cat.id)
        .single();

      if (existingEdge) {
        await supabase
          .from("kg_merchant_category")
          .update({ weight: existingEdge.weight + 1.0, updated_at: new Date().toISOString() })
          .eq("id", existingEdge.id);
      } else {
        await supabase.from("kg_merchant_category").insert({
          user_id: userId,
          merchant_id: merchant.id,
          category_id: cat.id,
          weight: 1.0,
        });
      }
    }
  }

  // Update time pattern (day of month)
  const date = new Date(txDate);
  const monthDay = date.getDate();

  const { data: existingPattern } = await supabase
    .from("kg_time_patterns")
    .select("id, occurrence_count")
    .eq("user_id", userId)
    .eq("merchant_id", merchant.id)
    .eq("month_day", monthDay)
    .single();

  if (existingPattern) {
    await supabase
      .from("kg_time_patterns")
      .update({
        occurrence_count: existingPattern.occurrence_count + 1,
        last_seen: txDate,
      })
      .eq("id", existingPattern.id);
  } else {
    await supabase.from("kg_time_patterns").insert({
      user_id: userId,
      merchant_id: merchant.id,
      month_day: monthDay,
      last_seen: txDate,
    });
  }
}

// ─── Full context traversal ──────────────────────────────────

/**
 * Traverse the graph for a given merchant name and return all
 * relevant context: top categories, time pattern, similar transactions.
 */
export async function traverseGraph(
  userId: string,
  merchantName: string,
  categoryHint: string | null
): Promise<GraphContext> {
  const merchant = await upsertMerchant(merchantName);

  if (!merchant) {
    return { merchant: null, topCategories: [], timePattern: null, similarTransactions: [] };
  }

  const [topCategories, timePattern, similarTransactions] = await Promise.all([
    getMerchantTopCategories(userId, merchant.id),
    getMerchantTimePattern(userId, merchant.id),
    getSimilarTransactions(userId, merchant.id, categoryHint),
  ]);

  return { merchant, topCategories, timePattern, similarTransactions };
}

// ─── Behavioral pattern detection ───────────────────────────

/**
 * Scan recent transactions and detect behavioral patterns.
 * Writes detected patterns into kg_behavioral_patterns.
 */
export async function detectAndStoreBehavioralPatterns(userId: string): Promise<void> {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const since = thirtyDaysAgo.toISOString().split("T")[0];

  const { data: txs } = await supabase
    .from("transactions")
    .select("id, merchant, amount, date, status")
    .eq("user_id", userId)
    .gte("date", since)
    .lt("amount", 0)
    .order("date", { ascending: false });

  if (!txs || txs.length < 5) return;

  // Detect recurring: same merchant appearing >= 3 times
  const merchantFreq: Record<string, number> = {};
  for (const tx of txs) {
    if (tx.merchant) {
      const key = normalizeMerchant(tx.merchant);
      merchantFreq[key] = (merchantFreq[key] ?? 0) + 1;
    }
  }

  for (const [merchantKey, count] of Object.entries(merchantFreq)) {
    if (count >= 3) {
      await supabase.from("kg_behavioral_patterns").upsert(
        {
          user_id: userId,
          type: "recurring",
          trigger: merchantKey,
          metadata: { count, period_days: 30 },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id,type,trigger", ignoreDuplicates: false }
      );
    }
  }

  // Detect impulse: large single transaction (> 3× average)
  const amounts = txs.map((t) => Math.abs(t.amount));
  const avg = amounts.reduce((a, b) => a + b, 0) / amounts.length;
  const impulses = txs.filter((t) => Math.abs(t.amount) > avg * 3);
  for (const tx of impulses) {
    await supabase.from("kg_behavioral_patterns").upsert(
      {
        user_id: userId,
        type: "impulse",
        trigger: tx.merchant ?? "unknown",
        metadata: { amount: Math.abs(tx.amount), avg_amount: avg, date: tx.date },
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,type,trigger", ignoreDuplicates: false }
    );
  }
}
