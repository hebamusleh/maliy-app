"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { Transaction } from "@/types/project";
import type { Project } from "@/types/project";
import TransactionFilters from "@/components/transactions/TransactionFilters";
import TransactionList from "@/components/transactions/TransactionList";
import TransactionDetailModal from "@/components/transactions/TransactionDetailModal";
import AddTransactionModal from "@/components/transactions/AddTransactionModal";

type TxWithJoins = Transaction & {
  project?: { id: string; name: string; icon: string; type: string } | null;
  category?: { id: string; name_ar: string; icon: string; color: string } | null;
};

async function fetchTransactions(params: URLSearchParams): Promise<{
  transactions: TxWithJoins[];
  total: number;
}> {
  const res = await fetch(`/api/transactions?${params.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch transactions");
  return res.json();
}

async function fetchProjects(): Promise<Project[]> {
  const res = await fetch("/api/projects");
  if (!res.ok) throw new Error("Failed to fetch projects");
  const json = await res.json();
  return json.projects ?? [];
}

function TransactionsInner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [activeFilter, setActiveFilter] = useState(
    searchParams.get("project_id") ?? "all"
  );
  const [search, setSearch] = useState(searchParams.get("search") ?? "");
  const [selectedTx, setSelectedTx] = useState<TxWithJoins | null>(null);
  const [showAdd, setShowAdd] = useState(false);

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: fetchProjects,
    staleTime: 5 * 60_000,
  });

  // Build query params
  const params = new URLSearchParams({ limit: "100" });
  if (activeFilter !== "all") {
    if (activeFilter === "pending") {
      params.set("status", "pending");
    } else {
      params.set("project_id", activeFilter);
    }
  }
  if (search) params.set("search", search);

  const { data, isLoading } = useQuery({
    queryKey: ["transactions", activeFilter, search],
    queryFn: () => fetchTransactions(params),
    staleTime: 30_000,
  });

  const transactions = data?.transactions ?? [];

  // Compute counts per filter
  const counts: Record<string, number> = { all: data?.total ?? 0 };
  counts.pending = transactions.filter((t) => t.status === "pending").length;
  for (const p of projects) {
    counts[p.id] = transactions.filter((t) => t.project_id === p.id).length;
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // search is already bound to state; query will refetch
  };

  const exportUrl = `/api/transactions/export${activeFilter !== "all" && activeFilter !== "pending" ? `?project_id=${activeFilter}` : ""}`;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-[26px] font-bold" style={{ color: "var(--ink)" }}>
            المعاملات
          </h1>
          <p className="text-[13px] opacity-55 mt-0.5" style={{ color: "var(--ink)" }}>
            {data?.total ?? 0} معاملة
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={exportUrl}
            className="px-3.5 py-2.5 rounded-2xl text-[12px] font-heading font-semibold transition-opacity hover:opacity-70"
            style={{ background: "var(--paper-3)", color: "var(--ink)" }}
          >
            تصدير CSV
          </a>
          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2.5 rounded-2xl text-[12.5px] font-heading font-semibold transition-all active:scale-95"
            style={{ background: "var(--ink)", color: "var(--amber-2)" }}
          >
            + إضافة
          </button>
        </div>
      </div>

      {/* Search */}
      <form onSubmit={handleSearchSubmit} className="relative">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث عن جهة أو تاجر..."
          className="w-full px-4 py-3 rounded-2xl text-[13.5px] font-heading outline-none"
          style={{
            background: "var(--paper-3)",
            border: "1px solid var(--line)",
            color: "var(--ink)",
          }}
          dir="rtl"
        />
        <span
          className="absolute start-4 top-1/2 -translate-y-1/2 opacity-40"
          style={{ color: "var(--ink)" }}
        >
          🔍
        </span>
      </form>

      {/* Filters */}
      <TransactionFilters
        projects={projects}
        activeFilter={activeFilter}
        onFilterChange={setActiveFilter}
        counts={counts}
      />

      {/* List */}
      <TransactionList
        transactions={transactions}
        isLoading={isLoading}
        onTransactionClick={(tx) => setSelectedTx(tx as TxWithJoins)}
      />

      {/* Modals */}
      {selectedTx && (
        <TransactionDetailModal
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      )}
      {showAdd && (
        <AddTransactionModal projects={projects} onClose={() => setShowAdd(false)} />
      )}
    </div>
  );
}

export default function TransactionsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-3">
          {[60, 200, 400].map((h, i) => (
            <div
              key={i}
              className="rounded-2xl animate-pulse"
              style={{ height: h, background: "var(--paper-3)" }}
            />
          ))}
        </div>
      }
    >
      <TransactionsInner />
    </Suspense>
  );
}
