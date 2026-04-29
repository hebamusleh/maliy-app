"use client";

interface Stat {
  label: string;
  value: string;
  change?: number; // percentage
  color?: string;
}

interface StatGridProps {
  stats: Stat[];
}

export default function StatGrid({ stats }: StatGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((s, i) => (
        <div
          key={i}
          className="rounded-2xl px-4 py-4 flex flex-col gap-1.5"
          style={{ background: "var(--paper-2)", border: "1px solid var(--line)" }}
        >
          <span
            className="text-[11.5px] font-heading opacity-55"
            style={{ color: "var(--ink)" }}
          >
            {s.label}
          </span>
          <span
            className="font-numbers text-[20px] font-bold leading-none"
            style={{ color: s.color ?? "var(--ink)" }}
          >
            {s.value}
          </span>
          {s.change !== undefined && (
            <div className="flex items-center gap-1">
              <span
                className="text-[11px] font-heading font-semibold"
                style={{ color: s.change >= 0 ? "var(--rose)" : "var(--sage)" }}
              >
                {s.change >= 0 ? "↑" : "↓"}{" "}
                {Math.abs(s.change).toFixed(1)}%
              </span>
              <span className="text-[11px] opacity-40" style={{ color: "var(--ink)" }}>
                مقارنة بالشهر الماضي
              </span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
