"use client";

import type { Project, ProjectStats } from "@/types/project";

interface ProjectDetailHeroProps {
  project: Project;
  stats: ProjectStats;
}

const PROJECT_ICONS: Record<string, string> = {
  personal: "👤",
  business: "💼",
  freelance: "🎯",
};

export default function ProjectDetailHero({ project, stats }: ProjectDetailHeroProps) {
  const icon = PROJECT_ICONS[project.type] ?? "📁";
  const formatter = new Intl.NumberFormat("ar-SA", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  const budgetPct = project.budget_limit
    ? Math.min(Math.round((stats.total_expenses / project.budget_limit) * 100), 100)
    : null;

  return (
    <div
      className="rounded-3xl p-6 relative overflow-hidden"
      style={{
        background: "var(--ink)",
        color: "var(--paper)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      {/* Ambient gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(500px 300px at 100% 0%, rgba(224,160,80,0.15), transparent 60%)",
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-[28px]"
            style={{
              background: "rgba(244,239,230,0.1)",
              border: "1px solid rgba(244,239,230,0.15)",
            }}
          >
            {icon}
          </div>
          <div>
            <h1
              className="font-heading text-[24px] font-bold"
              style={{ color: "var(--paper)" }}
            >
              {project.name}
            </h1>
            <span
              className="text-[12px] font-heading opacity-50 tracking-widest uppercase"
            >
              {project.type === "personal"
                ? "شخصي"
                : project.type === "business"
                ? "عمل"
                : "فريلانس"}
            </span>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div
              className="font-numbers text-[22px] font-medium"
              style={{ color: "var(--rose)" }}
            >
              {formatter.format(stats.total_expenses)}
            </div>
            <div className="text-[11px] opacity-50 mt-0.5">المصروفات</div>
          </div>

          {project.budget_limit ? (
            <div>
              <div
                className="font-numbers text-[22px] font-medium"
                style={{ color: "var(--sage)" }}
              >
                {formatter.format(Math.max(project.budget_limit - stats.total_expenses, 0))}
              </div>
              <div className="text-[11px] opacity-50 mt-0.5">المتبقي</div>
            </div>
          ) : (
            <div>
              <div
                className="font-numbers text-[22px] font-medium"
                style={{ color: "var(--sage)" }}
              >
                {formatter.format(stats.total_income)}
              </div>
              <div className="text-[11px] opacity-50 mt-0.5">الدخل</div>
            </div>
          )}

          <div>
            <div
              className="font-numbers text-[22px] font-medium"
              style={{ color: "var(--amber-2)" }}
            >
              {stats.transaction_count}
            </div>
            <div className="text-[11px] opacity-50 mt-0.5">معاملة</div>
          </div>
        </div>

        {/* Budget progress */}
        {budgetPct !== null && (
          <div className="mt-5">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-[11px] opacity-55">الميزانية المستخدمة</span>
              <span
                className="font-numbers text-[13px] font-medium"
                style={{ color: budgetPct >= 85 ? "var(--rose)" : "var(--amber-2)" }}
              >
                {budgetPct}%
              </span>
            </div>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: "rgba(244,239,230,0.12)" }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${budgetPct}%`,
                  background:
                    budgetPct >= 85
                      ? "var(--rose)"
                      : "linear-gradient(90deg, var(--sage), var(--amber-2))",
                }}
              />
            </div>
            {budgetPct >= 85 && (
              <p
                className="text-[11.5px] mt-2 opacity-75"
                style={{ color: "var(--rose)" }}
              >
                تحذير: تجاوزت 85% من الميزانية
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
