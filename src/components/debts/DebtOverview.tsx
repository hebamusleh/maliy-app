"use client";

import type { DebtSummary } from "@/types/index";

interface DebtOverviewProps {
  summary: DebtSummary;
}

function formatAmount(n: number) {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(Math.abs(n));
}

export default function DebtOverview({ summary }: DebtOverviewProps) {
  const isPositiveNet = summary.net >= 0;

  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{ background: "var(--ink)", color: "var(--paper)" }}
    >
      <div className="px-6 pt-6 pb-5">
        <p className="font-heading text-[13px] opacity-55 mb-1">الرصيد الصافي للديون</p>
        <p
          className="font-numbers text-[36px] font-bold leading-none"
          style={{ color: isPositiveNet ? "var(--sage)" : "var(--rose)" }}
        >
          {isPositiveNet ? "+" : "−"}{formatAmount(summary.net)}
        </p>
      </div>

      <div
        className="grid grid-cols-2 divide-x divide-x-reverse"
        style={{ borderTop: "1px solid rgba(255,255,255,0.1)" }}
      >
        <div className="px-5 py-4">
          <p className="text-[11.5px] font-heading opacity-50 mb-1">مستحق عليّ</p>
          <p
            className="font-numbers text-[20px] font-bold"
            style={{ color: "var(--rose)" }}
          >
            {formatAmount(summary.total_owed_by_me)}
          </p>
        </div>
        <div className="px-5 py-4">
          <p className="text-[11.5px] font-heading opacity-50 mb-1">مستحق لي</p>
          <p
            className="font-numbers text-[20px] font-bold"
            style={{ color: "var(--sage)" }}
          >
            {formatAmount(summary.total_owed_to_me)}
          </p>
        </div>
      </div>
    </div>
  );
}
