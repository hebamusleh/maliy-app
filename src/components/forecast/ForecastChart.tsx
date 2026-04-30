"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ReferenceArea,
  ResponsiveContainer,
} from "recharts";
import type { ForecastSnapshot } from "@/types/index";

interface ForecastChartProps {
  forecast: ForecastSnapshot;
}

export default function ForecastChart({ forecast }: ForecastChartProps) {
  const reversed = [...forecast.daily_balances].reverse().map((d) => ({
    date: new Date(d.date).toLocaleDateString("ar-SA", { month: "short", day: "numeric" }),
    balance: d.balance,
  }));

  const dangerZones = forecast.danger_zones ?? [];

  return (
    <div
      className="rounded-2xl px-4 py-4"
      style={{ background: "var(--paper-2)", border: "1px solid var(--line)" }}
    >
      <h3
        className="font-heading text-[15px] font-semibold mb-4"
        style={{ color: "var(--ink)" }}
      >
        مسار الرصيد المتوقع
      </h3>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={reversed} margin={{ top: 4, right: 0, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id="forecastGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--amber)" stopOpacity={0.25} />
              <stop offset="95%" stopColor="var(--amber)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
          <XAxis
            dataKey="date"
            reversed
            tick={{
              fontSize: 10,
              fill: "var(--ink)",
              opacity: 0.5,
              fontFamily: "var(--font-heading)",
            }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
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
          <ReferenceLine y={0} stroke="var(--rose)" strokeDasharray="4 2" strokeOpacity={0.6} />
          {dangerZones.map((z, i) => {
            const startLabel = new Date(z.start_date).toLocaleDateString("ar-SA", {
              month: "short",
              day: "numeric",
            });
            const endLabel = new Date(z.end_date).toLocaleDateString("ar-SA", {
              month: "short",
              day: "numeric",
            });
            return (
              <ReferenceArea
                key={i}
                x1={endLabel}
                x2={startLabel}
                fill="var(--rose)"
                fillOpacity={0.08}
              />
            );
          })}
          <Tooltip
            formatter={(value) => [
              new Intl.NumberFormat("ar-SA", {
                style: "currency",
                currency: "SAR",
                maximumFractionDigits: 0,
              }).format(Number(value ?? 0)),
              "الرصيد المتوقع",
            ]}
            contentStyle={{
              background: "var(--ink)",
              border: "none",
              borderRadius: 10,
              color: "var(--paper)",
              fontFamily: "var(--font-heading)",
              fontSize: 12,
            }}
          />
          <Area
            type="monotone"
            dataKey="balance"
            stroke="var(--amber)"
            strokeWidth={2}
            fill="url(#forecastGrad)"
            dot={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
