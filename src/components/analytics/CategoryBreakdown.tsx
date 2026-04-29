"use client";

import type { CategorySpend } from "@/types/index";

interface CategoryBreakdownProps {
  categories: CategorySpend[];
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function CategoryBreakdown({ categories }: CategoryBreakdownProps) {
  if (!categories.length) {
    return (
      <div
        className="rounded-2xl px-4 py-8 flex flex-col items-center gap-2"
        style={{ background: "var(--paper-2)", border: "1px solid var(--line)" }}
      >
        <span className="text-[30px]">📊</span>
        <p className="text-[13px] opacity-50 font-heading" style={{ color: "var(--ink)" }}>
          لا توجد بيانات للفئات
        </p>
      </div>
    );
  }

  const maxAmount = categories[0]?.amount ?? 1;

  return (
    <div
      className="rounded-2xl px-4 py-4 flex flex-col gap-4"
      style={{ background: "var(--paper-2)", border: "1px solid var(--line)" }}
    >
      <h3 className="font-heading text-[15px] font-semibold" style={{ color: "var(--ink)" }}>
        توزيع الفئات
      </h3>
      <div className="flex flex-col gap-3.5">
        {categories.slice(0, 8).map((c) => (
          <div key={c.category.id} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[16px]">{c.category.icon}</span>
                <span
                  className="text-[13px] font-heading"
                  style={{ color: "var(--ink)" }}
                >
                  {c.category.name_ar}
                </span>
              </div>
              <div className="text-end">
                <span
                  className="font-numbers text-[13px] font-bold"
                  style={{ color: "var(--ink)" }}
                >
                  {formatAmount(c.amount)}
                </span>
                <span
                  className="text-[11px] opacity-50 font-heading ms-1.5"
                  style={{ color: "var(--ink)" }}
                >
                  {c.pct.toFixed(0)}%
                </span>
              </div>
            </div>
            {/* Progress bar */}
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: "var(--paper-3)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(c.amount / maxAmount) * 100}%`,
                  background: c.category.color ?? "var(--amber)",
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
