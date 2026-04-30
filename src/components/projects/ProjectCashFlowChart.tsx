"use client";

import { Transaction } from "@/types/project";
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface ProjectCashFlowChartProps {
  transactions: Transaction[];
}

export default function ProjectCashFlowChart({ transactions }: ProjectCashFlowChartProps) {
  const sorted = [...transactions].sort((a, b) => a.date.localeCompare(b.date));

  let running = 0;
  const chartData = sorted.map((tx) => {
    running += tx.amount;
    return { date: tx.date, balance: running };
  });

  if (chartData.length === 0) return null;

  return (
    <div
      className="rounded-2xl p-4 flex flex-col gap-3"
      style={{ background: "var(--paper-2)", border: "1px solid var(--line)" }}
    >
      <h2 className="font-heading text-[15px] font-bold" style={{ color: "var(--ink)" }}>
        التدفق النقدي
      </h2>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: "var(--ink)", opacity: 0.6 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(d: string) => d.slice(5)}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--ink)", opacity: 0.6 }}
            axisLine={false}
            tickLine={false}
            width={55}
          />
          <ReferenceLine y={0} stroke="var(--line)" strokeDasharray="4 2" />
          <Tooltip
            contentStyle={{
              background: "var(--paper)",
              border: "1px solid var(--line)",
              borderRadius: 8,
              fontSize: 12,
            }}
            formatter={(value) => [`${Number(value ?? 0).toFixed(0)} ريال`, "الرصيد"]}
          />
          <Line
            type="monotone"
            dataKey="balance"
            stroke="var(--amber)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
