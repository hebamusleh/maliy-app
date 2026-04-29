"use client";

import Link from "next/link";
import type { Alert } from "@/types/index";

const ALERT_STYLE: Record<string, { border: string; iconBg: string; iconColor: string }> = {
  urgent: {
    border: "var(--rose)",
    iconBg: "rgba(184,92,92,0.15)",
    iconColor: "var(--rose)",
  },
  recommendation: {
    border: "var(--amber)",
    iconBg: "rgba(200,133,58,0.15)",
    iconColor: "var(--amber)",
  },
  reminder: {
    border: "var(--amber)",
    iconBg: "rgba(200,133,58,0.15)",
    iconColor: "var(--amber)",
  },
  achievement: {
    border: "var(--sage)",
    iconBg: "rgba(107,142,107,0.18)",
    iconColor: "var(--sage)",
  },
};

const ICONS: Record<string, string> = {
  urgent: "⚠",
  recommendation: "💡",
  reminder: "📅",
  achievement: "🏆",
};

export default function AlertsPreview({ alerts }: { alerts: Alert[] }) {
  if (!alerts.length) return null;

  return (
    <section>
      <div className="flex items-baseline justify-between mb-3.5">
        <h2 className="font-heading text-[20px] font-semibold">التنبيهات الذكية</h2>
        <Link href="/alerts" className="text-[13px]" style={{ color: "var(--amber)" }}>
          عرض الكل ←
        </Link>
      </div>

      <div className="flex flex-col gap-2.5">
        {alerts.slice(0, 2).map((alert) => {
          const s = ALERT_STYLE[alert.type] ?? ALERT_STYLE.achievement;
          return (
            <div
              key={alert.id}
              className="flex gap-3.5 items-start px-4 py-4 rounded-2xl relative overflow-hidden"
              style={{
                background: "var(--paper-2)",
                border: "1px solid var(--line)",
              }}
            >
              {/* Left accent bar (in RTL this is the end side) */}
              <div
                className="absolute inset-y-0 end-0 w-1 rounded-sm"
                style={{ background: s.border }}
              />

              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-[17px]"
                style={{ background: s.iconBg, color: s.iconColor }}
              >
                {ICONS[alert.type] ?? "ℹ"}
              </div>

              <div className="flex-1">
                <b className="block font-heading text-[14.5px] mb-1">{alert.title}</b>
                <p className="text-[13px] opacity-75 leading-relaxed">{alert.body}</p>
                <span className="block text-[11px] opacity-50 mt-1.5 font-heading">
                  {new Date(alert.created_at).toLocaleDateString("ar-SA")}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
