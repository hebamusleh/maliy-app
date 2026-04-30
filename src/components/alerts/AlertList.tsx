"use client";

import type { Alert } from "@/types/index";
import AlertItem from "./AlertItem";

interface AlertListProps {
  alerts: Alert[];
  emptyLabel?: string;
}

export default function AlertList({ alerts, emptyLabel = "لا توجد تنبيهات" }: AlertListProps) {
  if (alerts.length === 0) {
    return (
      <div
        className="rounded-3xl flex flex-col items-center justify-center gap-3 py-16"
        style={{ background: "var(--paper-2)", border: "1px solid var(--line)" }}
      >
        <span className="text-[40px]">🔔</span>
        <p
          className="font-heading text-[15px] font-semibold opacity-55"
          style={{ color: "var(--ink)" }}
        >
          {emptyLabel}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2.5">
      {alerts.map((alert) => (
        <AlertItem key={alert.id} alert={alert} />
      ))}
    </div>
  );
}
