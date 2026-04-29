"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { DailySpend } from "@/types/index";

interface DailySpendChartProps {
  data: DailySpend[];
  month: string; // e.g. 'إبريل 2026'
}

export default function DailySpendChart({ data, month }: DailySpendChartProps) {
  // Reverse for RTL display
  const reversed = [...data].reverse();

  if (!data.length) {
    return (
      <div
        className="rounded-2xl px-4 py-8 flex flex-col items-center gap-2"
        style={{ background: "var(--paper-2)", border: "1px solid var(--line)" }}
      >
        <span className="text-[30px]">📈</span>
        <p className="text-[13px] opacity-50 font-heading" style={{ color: "var(--ink)" }}>
          لا توجد بيانات للإنفاق اليومي
        </p>
      </div>
    );
  }

  const formatted = reversed.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("ar-SA", { day: "numeric" }),
  }));

  return (
    <div
      className="rounded-2xl px-4 py-4"
      style={{ background: "var(--paper-2)", border: "1px solid var(--line)" }}
    >
      <h3
        className="font-heading text-[15px] font-semibold mb-1"
        style={{ color: "var(--ink)" }}
      >
        الإنفاق اليومي
      </h3>
      <p className="text-[12px] opacity-50 mb-4 font-heading" style={{ color: "var(--ink)" }}>
        {month}
      </p>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={formatted} barSize={6} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="var(--line)"
            vertical={false}
          />
          <XAxis
            dataKey="label"
            reversed
            tick={{
              fontSize: 10,
              fill: "var(--ink)",
              opacity: 0.5,
              fontFamily: "var(--font-heading)",
            }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{
              fontSize: 10,
              fill: "var(--ink)",
              opacity: 0.5,
              fontFamily: "var(--font-numbers)",
            }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) =>
              new Intl.NumberFormat("ar-SA", { notation: "compact" }).format(v)
            }
          />
          <Tooltip
            formatter={(value: number) => [
              new Intl.NumberFormat("ar-SA", {
                style: "currency",
                currency: "SAR",
                maximumFractionDigits: 0,
              }).format(value),
              "الإنفاق",
            ]}
            contentStyle={{
              background: "var(--ink)",
              border: "none",
              borderRadius: 10,
              color: "var(--paper)",
              fontFamily: "var(--font-heading)",
              fontSize: 12,
            }}
            cursor={{ fill: "rgba(14,27,44,0.06)" }}
          />
          <Bar dataKey="amount" fill="var(--amber)" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
