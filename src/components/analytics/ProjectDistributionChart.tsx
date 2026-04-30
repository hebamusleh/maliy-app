"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import type { ProjectDistribution } from "@/types/index";

interface ProjectDistributionChartProps {
  data: ProjectDistribution[];
}

const COLORS = ["var(--amber)", "var(--sage)", "var(--rose)", "var(--amber-2)", "#7B9EB0", "#C4A47C"];

function formatAmount(amount: number) {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export default function ProjectDistributionChart({ data }: ProjectDistributionChartProps) {
  if (!data.length) {
    return (
      <div
        className="rounded-2xl px-4 py-8 flex flex-col items-center gap-2"
        style={{ background: "var(--paper-2)", border: "1px solid var(--line)" }}
      >
        <span className="text-[30px]">🥧</span>
        <p className="text-[13px] opacity-50 font-heading" style={{ color: "var(--ink)" }}>
          لا توجد بيانات للمشاريع
        </p>
      </div>
    );
  }

  const chartData = data.map((d) => ({
    name: `${d.project.icon} ${d.project.name}`,
    value: d.amount,
    pct: d.pct,
  }));

  return (
    <div
      className="rounded-2xl px-4 py-4"
      style={{ background: "var(--paper-2)", border: "1px solid var(--line)" }}
    >
      <h3
        className="font-heading text-[15px] font-semibold mb-4"
        style={{ color: "var(--ink)" }}
      >
        توزيع المصروفات حسب المشروع
      </h3>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={3}
            dataKey="value"
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="none" />
            ))}
          </Pie>
          <Tooltip
            formatter={(value) => [formatAmount(Number(value ?? 0)), "المبلغ"]}
            contentStyle={{
              background: "var(--ink)",
              border: "none",
              borderRadius: 12,
              color: "var(--paper)",
              fontFamily: "var(--font-heading)",
              fontSize: 12,
            }}
          />
          <Legend
            iconType="circle"
            iconSize={8}
            formatter={(value) => (
              <span style={{ color: "var(--ink)", fontSize: 12, fontFamily: "var(--font-heading)" }}>
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
