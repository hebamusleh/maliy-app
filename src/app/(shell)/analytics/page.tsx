"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { AnalyticsData } from "@/types/index";
import StatGrid from "@/components/analytics/StatGrid";
import CategoryBreakdown from "@/components/analytics/CategoryBreakdown";
import ProjectDistributionChart from "@/components/analytics/ProjectDistributionChart";
import DailySpendChart from "@/components/analytics/DailySpendChart";

function formatAmount(n: number) {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(n);
}

function monthLabel(iso: string) {
  const [y, m] = iso.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleDateString("ar-SA", {
    month: "long",
    year: "numeric",
  });
}

function prevMonth(iso: string) {
  const [y, m] = iso.split("-").map(Number);
  const d = new Date(y, m - 2, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function nextMonth(iso: string) {
  const [y, m] = iso.split("-").map(Number);
  const d = new Date(y, m, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

const currentIso = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
};

export default function AnalyticsPage() {
  const [month, setMonth] = useState(currentIso());

  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["analytics", month],
    queryFn: async () => {
      const res = await fetch(`/api/analytics?month=${month}`);
      if (!res.ok) throw new Error("Analytics fetch failed");
      return res.json();
    },
    staleTime: 5 * 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[80, 180, 200, 200].map((h, i) => (
          <div
            key={i}
            className="rounded-2xl animate-pulse"
            style={{ height: h, background: "var(--paper-3)" }}
          />
        ))}
      </div>
    );
  }

  const stats = data
    ? [
        {
          label: "الدخل",
          value: formatAmount(data.income),
          change: data.income_change_pct,
          color: "var(--sage)",
        },
        {
          label: "المصروفات",
          value: formatAmount(data.expenses),
          change: data.expenses_change_pct,
          color: "var(--rose)",
        },
        {
          label: "المتوسط اليومي",
          value: formatAmount(data.daily_average),
          color: "var(--amber)",
        },
        {
          label: "نسبة الادخار",
          value: `${(data.savings_rate * 100).toFixed(0)}%`,
          color: "var(--ink)",
        },
      ]
    : [];

  return (
    <div className="flex flex-col gap-6">
      {/* Header + month nav */}
      <div className="flex items-center justify-between">
        <h1
          className="font-heading text-[26px] font-bold"
          style={{ color: "var(--ink)" }}
        >
          التحليلات
        </h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMonth(nextMonth(month))}
            disabled={month >= currentIso()}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[14px] transition-opacity hover:opacity-70 disabled:opacity-30"
            style={{ background: "var(--paper-3)", color: "var(--ink)" }}
          >
            ‹
          </button>
          <span
            className="text-[13px] font-heading font-semibold min-w-[100px] text-center"
            style={{ color: "var(--ink)" }}
          >
            {monthLabel(month)}
          </span>
          <button
            onClick={() => setMonth(prevMonth(month))}
            className="w-8 h-8 rounded-xl flex items-center justify-center text-[14px] transition-opacity hover:opacity-70"
            style={{ background: "var(--paper-3)", color: "var(--ink)" }}
          >
            ›
          </button>
        </div>
      </div>

      {/* Stats */}
      <StatGrid stats={stats} />

      {/* Category breakdown */}
      <CategoryBreakdown categories={data?.categories ?? []} />

      {/* Project distribution */}
      <ProjectDistributionChart data={data?.project_distribution ?? []} />

      {/* Daily spend */}
      <DailySpendChart data={data?.daily_spend ?? []} month={monthLabel(month)} />
    </div>
  );
}
