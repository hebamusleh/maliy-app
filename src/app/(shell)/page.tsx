"use client";

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import BalanceCard from "@/components/dashboard/BalanceCard";
import ReviewBanner from "@/components/dashboard/ReviewBanner";
import ProjectSummaryCards from "@/components/dashboard/ProjectSummaryCards";
import CashFlowChart from "@/components/dashboard/CashFlowChart";
import AlertsPreview from "@/components/dashboard/AlertsPreview";
import type { DashboardData, ForecastSnapshot } from "@/types/index";

export default function DashboardPage() {
  const router = useRouter();

  const { data: dashboard, isLoading } = useQuery<DashboardData>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Dashboard fetch failed");
      return res.json();
    },
    staleTime: 60_000,
  });

  const { data: forecast } = useQuery<ForecastSnapshot>({
    queryKey: ["forecast", 30],
    queryFn: async () => {
      const res = await fetch("/api/forecast?horizon=30");
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 6 * 60 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        {[120, 200, 120, 260, 160].map((h, i) => (
          <div
            key={i}
            className="rounded-3xl animate-pulse"
            style={{ height: h, background: "var(--paper-3)" }}
          />
        ))}
      </div>
    );
  }

  // Build chart data from forecast
  const chartData =
    forecast?.daily_balances?.map((d) => ({
      date: new Date(d.date).toLocaleDateString("ar-SA", { month: "short", day: "numeric" }),
      actual: d.balance,
      forecast: null as number | null,
    })) ?? [];

  const dangerZones = forecast?.danger_zones?.map((z) => ({
    start: new Date(z.start_date).toLocaleDateString("ar-SA", { month: "short", day: "numeric" }),
    end: new Date(z.end_date).toLocaleDateString("ar-SA", { month: "short", day: "numeric" }),
  })) ?? [];

  return (
    <div className="flex flex-col gap-5">
      {/* Review banner */}
      {(dashboard?.pending_count ?? 0) > 0 && (
        <ReviewBanner
          pendingCount={dashboard?.pending_count ?? 0}
          onStart={() => router.push("/review")}
        />
      )}

      {/* Balance card */}
      <BalanceCard
        balance={dashboard?.balance ?? 0}
        income={dashboard?.income ?? 0}
        expenses={dashboard?.expenses ?? 0}
        savings={dashboard?.savings ?? 0}
        pendingCount={dashboard?.pending_count ?? 0}
        changePercent={dashboard?.balance_change_pct ?? 0}
        currency={dashboard?.currency ?? "SAR"}
      />

      {/* Project cards */}
      <ProjectSummaryCards projects={dashboard?.projects ?? []} />

      {/* Cash flow chart */}
      <CashFlowChart data={chartData} dangerZones={dangerZones} />

      {/* Alerts preview */}
      <AlertsPreview alerts={dashboard?.recent_alerts ?? []} />
    </div>
  );
}
