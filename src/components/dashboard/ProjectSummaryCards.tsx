"use client";

import Link from "next/link";
import type { ProjectSummary } from "@/types/index";

const TYPE_STYLES: Record<string, { iconBg: string; iconColor: string; barGrad: string }> = {
  personal: {
    iconBg: "rgba(200,133,58,0.15)",
    iconColor: "var(--amber)",
    barGrad: "linear-gradient(90deg, var(--amber-2), var(--amber))",
  },
  business: {
    iconBg: "rgba(14,27,44,0.10)",
    iconColor: "var(--ink)",
    barGrad: "linear-gradient(90deg, var(--ink-3), var(--ink))",
  },
  freelance: {
    iconBg: "rgba(107,142,107,0.18)",
    iconColor: "var(--sage)",
    barGrad: "linear-gradient(90deg, #8FB28F, var(--sage))",
  },
};

const fmt = (n: number) =>
  new Intl.NumberFormat("ar-SA", { minimumFractionDigits: 0 }).format(Math.round(n));

export default function ProjectSummaryCards({ projects }: { projects: ProjectSummary[] }) {
  if (!projects.length) return null;

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3.5">
        <h2 className="font-heading text-[20px] font-semibold">المشاريع</h2>
        <Link href="/analytics" className="text-[13px]" style={{ color: "var(--amber)" }}>
          عرض التحليل ←
        </Link>
      </div>

      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        {projects.slice(0, 3).map(({ project, spend, budget_used_pct, remaining, transaction_count }) => {
          const style = TYPE_STYLES[project.type] ?? TYPE_STYLES.personal;
          const isOverBudget = budget_used_pct > 85;

          return (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="rounded-[18px] p-5 cursor-pointer transition-transform hover:-translate-y-0.5 relative overflow-hidden block"
              style={{
                background: "var(--paper-2)",
                border: "1px solid var(--line)",
                boxShadow: "none",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div className="flex items-center gap-2.5 mb-3.5">
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-[18px]"
                  style={{ background: style.iconBg, color: style.iconColor }}
                >
                  {project.icon}
                </div>
                <div>
                  <div className="font-heading font-semibold text-[15px]">{project.name}</div>
                  <div className="text-[11px] opacity-60">{transaction_count} معاملة هذا الشهر</div>
                </div>
              </div>

              <div className="font-numbers text-[28px]" style={{ letterSpacing: -0.5 }}>
                <small className="text-[13px] opacity-50 me-1">ر.س</small>
                {fmt(spend)}
              </div>

              <div
                className="mt-3.5 h-1.5 rounded-sm overflow-hidden"
                style={{ background: "var(--paper-3)" }}
              >
                <div
                  className="h-full rounded-sm transition-all"
                  style={{
                    width: `${Math.min(budget_used_pct, 100)}%`,
                    background: style.barGrad,
                  }}
                />
              </div>

              <div className="flex justify-between mt-2 text-[11px] opacity-65 font-heading">
                <span>{Math.round(budget_used_pct)}٪ من الميزانية</span>
                <span>الباقي {fmt(remaining)}</span>
              </div>

              {isOverBudget && (
                <div
                  className="mt-2.5 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11.5px] font-heading"
                  style={{
                    background: "rgba(200,133,58,0.10)",
                    border: "1px dashed rgba(200,133,58,0.35)",
                    color: "var(--amber)",
                  }}
                >
                  <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  قاربت الحدّ
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
