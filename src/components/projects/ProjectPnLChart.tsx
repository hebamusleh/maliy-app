"use client";

import { prepareChartData } from "@/lib/project-stats";
import { Transaction } from "@/types/project";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ProjectPnLChartProps {
  transactions: Transaction[];
}

const MONTH_NAMES: Record<string, string> = {
  "01": "يناير", "02": "فبراير", "03": "مارس",
  "04": "أبريل", "05": "مايو", "06": "يونيو",
  "07": "يوليو", "08": "أغسطس", "09": "سبتمبر",
  "10": "أكتوبر", "11": "نوفمبر", "12": "ديسمبر",
};

function formatMonth(key: string) {
  const [, m] = key.split("-");
  return MONTH_NAMES[m] ?? key;
}

export default function ProjectPnLChart({ transactions }: ProjectPnLChartProps) {
  const chartData = prepareChartData(transactions).map((d) => ({
    ...d,
    month: formatMonth(d.month),
  }));

  if (chartData.length === 0) return null;

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: "var(--paper-2)", border: "1px solid var(--line)" }}
    >
      <h2 className="font-heading text-[15px] font-bold" style={{ color: "var(--ink)" }}>
        الأرباح والخسائر
      </h2>
      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 11, fill: "var(--ink)", opacity: 0.6 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--ink)", opacity: 0.6 }}
            axisLine={false}
            tickLine={false}
            width={50}
          />
          <Tooltip
            contentStyle={{
              background: "var(--paper)",
              border: "1px solid var(--line)",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value, name) => [
              `${Number(value ?? 0).toFixed(0)} ريال`,
              name === "income" ? "الدخل" : "المصروفات",
            ]}
          />
          <Legend
            formatter={(value) => (value === "income" ? "الدخل" : "المصروفات")}
            wrapperStyle={{ fontSize: 12 }}
          />
          <Bar dataKey="income" fill="var(--sage)" radius={[4, 4, 0, 0]} name="income" />
          <Bar dataKey="expenses" fill="var(--rose)" radius={[4, 4, 0, 0]} name="expenses" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
