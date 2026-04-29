"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ForecastSnapshot } from "@/types/index";
import ForecastScenarios from "@/components/forecast/ForecastScenarios";
import ForecastChart from "@/components/forecast/ForecastChart";
import UpcomingEvents from "@/components/forecast/UpcomingEvents";

const HORIZONS: Array<{ value: 7 | 30 | 90; label: string }> = [
  { value: 7, label: "7 أيام" },
  { value: 30, label: "30 يوماً" },
  { value: 90, label: "90 يوماً" },
];

export default function ForecastPage() {
  const [horizon, setHorizon] = useState<7 | 30 | 90>(30);

  const { data: forecast, isLoading } = useQuery<ForecastSnapshot>({
    queryKey: ["forecast", horizon],
    queryFn: async () => {
      const res = await fetch(`/api/forecast?horizon=${horizon}`);
      if (!res.ok) throw new Error("Forecast fetch failed");
      return res.json();
    },
    staleTime: 6 * 60 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {[60, 120, 220, 160].map((h, i) => (
          <div
            key={i}
            className="rounded-2xl animate-pulse"
            style={{ height: h, background: "var(--paper-3)" }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="font-heading text-[26px] font-bold"
            style={{ color: "var(--ink)" }}
          >
            التوقعات المالية
          </h1>
          <p className="text-[13px] opacity-55 mt-0.5" style={{ color: "var(--ink)" }}>
            محاكاة مونت كارلو بناءً على أنماط إنفاقك
          </p>
        </div>

        {/* Horizon selector */}
        <div
          className="flex items-center gap-1 p-1 rounded-2xl"
          style={{ background: "var(--paper-3)" }}
        >
          {HORIZONS.map((h) => (
            <button
              key={h.value}
              onClick={() => setHorizon(h.value)}
              className="px-3 py-1.5 rounded-xl text-[12px] font-heading font-semibold transition-all"
              style={{
                background: horizon === h.value ? "var(--ink)" : "transparent",
                color: horizon === h.value ? "var(--amber-2)" : "var(--ink)",
                opacity: horizon === h.value ? 1 : 0.65,
              }}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {forecast ? (
        <>
          {/* Scenarios */}
          <ForecastScenarios
            pessimistic={forecast.pessimistic}
            likely={forecast.likely}
            optimistic={forecast.optimistic}
          />

          {/* Chart */}
          <ForecastChart forecast={forecast} />

          {/* Upcoming events */}
          <UpcomingEvents events={forecast.upcoming_events ?? []} />

          {/* Danger zone warning */}
          {forecast.danger_zones && forecast.danger_zones.length > 0 && (
            <div
              className="rounded-2xl px-4 py-4 flex items-start gap-3"
              style={{
                background: "rgba(184,92,92,0.1)",
                border: "1.5px solid rgba(184,92,92,0.3)",
              }}
            >
              <span className="text-[22px] flex-shrink-0">⚠️</span>
              <div>
                <p
                  className="font-heading text-[14px] font-semibold"
                  style={{ color: "var(--rose)" }}
                >
                  تحذير: رصيد سلبي محتمل
                </p>
                <p
                  className="text-[12.5px] leading-relaxed mt-1 opacity-75"
                  style={{ color: "var(--ink)" }}
                >
                  في السيناريو المحتمل، قد يصبح رصيدك سلبياً خلال أفق التوقع.
                  ننصح بمراجعة مصروفاتك.
                </p>
              </div>
            </div>
          )}

          {/* Generated at */}
          <p className="text-[11px] opacity-40 text-center font-heading" style={{ color: "var(--ink)" }}>
            آخر تحديث:{" "}
            {new Date(forecast.generated_at).toLocaleString("ar-SA")}
          </p>
        </>
      ) : (
        <div
          className="rounded-3xl flex flex-col items-center justify-center gap-3 py-16"
          style={{ background: "var(--paper-2)", border: "1px solid var(--line)" }}
        >
          <span className="text-[40px]">📊</span>
          <p
            className="font-heading text-[15px] font-semibold opacity-60"
            style={{ color: "var(--ink)" }}
          >
            لا توجد بيانات كافية للتوقع
          </p>
          <p className="text-[13px] opacity-45 text-center px-8" style={{ color: "var(--ink)" }}>
            أضف بعض المعاملات لتفعيل التوقعات الذكية
          </p>
        </div>
      )}
    </div>
  );
}
