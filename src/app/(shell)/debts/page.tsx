"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Debt, DebtSummary } from "@/types/index";
import DebtOverview from "@/components/debts/DebtOverview";
import DebtCard from "@/components/debts/DebtCard";
import AddDebtModal from "@/components/debts/AddDebtModal";

async function fetchDebts(): Promise<{ debts: Debt[]; summary: DebtSummary }> {
  const res = await fetch("/api/debts");
  if (!res.ok) throw new Error("Failed to fetch debts");
  return res.json();
}

export default function DebtsPage() {
  const [showAdd, setShowAdd] = useState(false);
  const [activeTab, setActiveTab] = useState<"all" | "owed_by_me" | "owed_to_me">("all");

  const { data, isLoading } = useQuery({
    queryKey: ["debts"],
    queryFn: fetchDebts,
    staleTime: 60_000,
  });

  const allDebts = data?.debts ?? [];
  const filtered =
    activeTab === "all"
      ? allDebts
      : allDebts.filter((d) => d.direction === activeTab);

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[120, 80, 80, 80].map((h, i) => (
          <div
            key={i}
            className="rounded-2xl animate-pulse"
            style={{ height: h, background: "var(--paper-3)" }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-[26px] font-bold" style={{ color: "var(--ink)" }}>
          الديون
        </h1>
        <button
          onClick={() => setShowAdd(true)}
          className="px-4 py-2.5 rounded-2xl text-[12.5px] font-heading font-semibold transition-all active:scale-95"
          style={{ background: "var(--ink)", color: "var(--amber-2)" }}
        >
          + إضافة دين
        </button>
      </div>

      {/* Overview */}
      {data?.summary && <DebtOverview summary={data.summary} />}

      {/* Tabs */}
      <div
        className="flex gap-1 p-1 rounded-2xl"
        style={{ background: "var(--paper-3)" }}
      >
        {(
          [
            { id: "all", label: "الكل" },
            { id: "owed_by_me", label: "مستحق عليّ" },
            { id: "owed_to_me", label: "مستحق لي" },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className="flex-1 py-2 rounded-xl text-[12.5px] font-heading font-semibold transition-all"
            style={{
              background: activeTab === t.id ? "var(--ink)" : "transparent",
              color: activeTab === t.id ? "var(--amber-2)" : "var(--ink)",
              opacity: activeTab === t.id ? 1 : 0.6,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Debt list */}
      {filtered.length === 0 ? (
        <div
          className="rounded-3xl flex flex-col items-center justify-center gap-3 py-14"
          style={{ background: "var(--paper-2)", border: "1px solid var(--line)" }}
        >
          <span className="text-[36px]">🤝</span>
          <p
            className="font-heading text-[15px] font-semibold opacity-55"
            style={{ color: "var(--ink)" }}
          >
            لا توجد ديون
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((debt) => (
            <DebtCard key={debt.id} debt={debt} />
          ))}
        </div>
      )}

      {showAdd && <AddDebtModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
