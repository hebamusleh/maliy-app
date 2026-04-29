"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceArea,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  date: string;
  actual: number | null;
  forecast: number | null;
}

interface DangerZone {
  start: string;
  end: string;
}

interface CashFlowChartProps {
  data: DataPoint[];
  dangerZones?: DangerZone[];
}

const HORIZONS: Array<7 | 30 | 90> = [7, 30, 90];

export default function CashFlowChart({ data, dangerZones = [] }: CashFlowChartProps) {
  const [horizon, setHorizon] = useState<7 | 30 | 90>(30);

  // Show last N data points based on horizon
  const sliced = data.slice(-horizon);
  const reversed = [...sliced].reverse(); // RTL: newest on right = reverse for LTR recharts

  return (
    <section
      className="rounded-[22px] p-6"
      style={{ background: "var(--paper-2)", border: "1px solid var(--line)" }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-heading text-[18px] font-semibold">التدفق النقدي المتوقع</h2>
          <p className="text-[12.5px] opacity-60 mt-0.5">
            توقع ذكي بناءً على نمط معاملاتك السابقة
          </p>
        </div>

        <div
          className="flex gap-1 p-1 rounded-xl"
          style={{ background: "var(--paper)", border: "1px solid var(--line)" }}
        >
          {HORIZONS.map((h) => (
            <button
              key={h}
              onClick={() => setHorizon(h)}
              className="rounded-lg px-3 py-1.5 font-heading text-[12.5px] transition-all"
              style={
                horizon === h
                  ? { background: "var(--ink)", color: "var(--paper)" }
                  : { background: "transparent", color: "var(--ink)", opacity: 0.55 }
              }
            >
              {h} {h === 7 ? "أيام" : "يوم"}
            </button>
          ))}
        </div>
      </div>

      <div style={{ height: 240 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={reversed} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <defs>
              <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0E1B2C" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#0E1B2C" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradForecast" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#C8853A" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#C8853A" stopOpacity={0} />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(14,27,44,0.06)"
              vertical={false}
            />

            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: "rgba(14,27,44,0.5)", fontFamily: "var(--font-heading)" }}
              axisLine={false}
              tickLine={false}
              reversed
            />
            <YAxis
              tick={{ fontSize: 11, fill: "rgba(14,27,44,0.5)", fontFamily: "var(--font-heading)" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
            />

            <Tooltip
              contentStyle={{
                fontFamily: "var(--font-heading)",
                fontSize: 12,
                background: "var(--paper)",
                border: "1px solid var(--line)",
                borderRadius: 12,
                direction: "rtl",
              }}
              formatter={(value: number, name: string) => [
                `${value.toLocaleString("ar-SA")} ر.س`,
                name === "actual" ? "الرصيد الفعلي" : "التوقع",
              ]}
            />

            {/* Danger zones */}
            {dangerZones.map((zone, i) => (
              <ReferenceArea
                key={i}
                x1={zone.start}
                x2={zone.end}
                fill="rgba(184,92,92,0.12)"
                stroke="rgba(184,92,92,0.3)"
                strokeWidth={1}
              />
            ))}

            <Area
              type="monotone"
              dataKey="actual"
              stroke="#0E1B2C"
              strokeWidth={2}
              fill="url(#gradActual)"
              dot={false}
              connectNulls={false}
            />
            <Area
              type="monotone"
              dataKey="forecast"
              stroke="#C8853A"
              strokeWidth={2}
              strokeDasharray="6 3"
              fill="url(#gradForecast)"
              dot={false}
              connectNulls={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div
        className="flex gap-4 mt-3.5 pt-3.5 flex-wrap"
        style={{ borderTop: "1px dashed var(--line)" }}
      >
        {[
          { color: "var(--ink)", label: "الرصيد الفعلي" },
          { color: "var(--amber)", label: "التوقع الذكي" },
          { color: "var(--rose)", label: "منطقة الخطر" },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2 text-[12.5px]">
            <span
              className="w-2.5 h-2.5 rounded-full"
              style={{ background: color }}
            />
            {label}
          </div>
        ))}
      </div>
    </section>
  );
}
