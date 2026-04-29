"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Alert, AlertCounts, AlertType } from "@/types/index";
import AlertTabs from "@/components/alerts/AlertTabs";
import AlertItem from "@/components/alerts/AlertItem";

type Tab = "all" | AlertType;

async function fetchAlerts(
  type?: AlertType
): Promise<{ alerts: Alert[]; counts: AlertCounts }> {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  const res = await fetch(`/api/alerts?${params}`);
  if (!res.ok) throw new Error("Failed to fetch alerts");
  return res.json();
}

const emptyCounts: AlertCounts = {
  all: 0,
  urgent: 0,
  recommendation: 0,
  reminder: 0,
  achievement: 0,
};

export default function AlertsPage() {
  const [activeTab, setActiveTab] = useState<Tab>("all");

  const { data, isLoading } = useQuery({
    queryKey: ["alerts", activeTab],
    queryFn: () => fetchAlerts(activeTab === "all" ? undefined : activeTab),
    staleTime: 30_000,
  });

  // Also fetch counts (for tabs) without type filter
  const { data: countsData } = useQuery({
    queryKey: ["alerts", "counts"],
    queryFn: () => fetchAlerts(),
    staleTime: 60_000,
  });

  const alerts = data?.alerts ?? [];
  const counts = countsData?.counts ?? emptyCounts;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <h1 className="font-heading text-[26px] font-bold" style={{ color: "var(--ink)" }}>
        التنبيهات الذكية
      </h1>

      {/* Tabs */}
      <AlertTabs active={activeTab} onChange={setActiveTab} counts={counts} />

      {/* List */}
      {isLoading ? (
        <div className="flex flex-col gap-2.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-20 rounded-2xl animate-pulse"
              style={{ background: "var(--paper-3)" }}
            />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div
          className="rounded-3xl flex flex-col items-center justify-center gap-3 py-16"
          style={{ background: "var(--paper-2)", border: "1px solid var(--line)" }}
        >
          <span className="text-[40px]">🔔</span>
          <p
            className="font-heading text-[15px] font-semibold opacity-55"
            style={{ color: "var(--ink)" }}
          >
            لا توجد تنبيهات
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {alerts.map((alert) => (
            <AlertItem key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
}
