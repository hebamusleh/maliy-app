"use client";

import type { ForecastSnapshot } from "@/types/index";

type Event = NonNullable<ForecastSnapshot["upcoming_events"]>[number];

interface UpcomingEventsProps {
  events: Event[];
}

const EVENT_ICONS: Record<string, string> = {
  income: "💰",
  expense: "💸",
  subscription: "🔄",
};

function formatAmount(n: number) {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function UpcomingEvents({ events }: UpcomingEventsProps) {
  if (!events.length) return null;

  return (
    <div
      className="rounded-2xl px-4 py-4"
      style={{ background: "var(--paper-2)", border: "1px solid var(--line)" }}
    >
      <h3
        className="font-heading text-[15px] font-semibold mb-4"
        style={{ color: "var(--ink)" }}
      >
        الأحداث القادمة
      </h3>
      <div className="flex flex-col gap-2.5">
        {events.map((ev, i) => {
          const isExpense = ev.type === "expense" || ev.type === "subscription";
          return (
            <div
              key={i}
              className="flex items-center gap-3 px-3 py-3 rounded-xl"
              style={{ background: "var(--paper-3)" }}
            >
              <span className="text-[18px] flex-shrink-0">{EVENT_ICONS[ev.type] ?? "📌"}</span>
              <div className="flex-1 min-w-0">
                <p
                  className="text-[13px] font-heading font-semibold truncate"
                  style={{ color: "var(--ink)" }}
                >
                  {ev.label}
                </p>
                <p
                  className="text-[11.5px] font-heading opacity-55"
                  style={{ color: "var(--ink)" }}
                >
                  {new Date(ev.date).toLocaleDateString("ar-SA", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
              </div>
              <span
                className="font-numbers text-[14px] font-bold flex-shrink-0"
                style={{ color: isExpense ? "var(--rose)" : "var(--sage)" }}
              >
                {isExpense ? "−" : "+"}{formatAmount(ev.amount)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
