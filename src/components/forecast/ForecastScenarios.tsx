"use client";

interface ForecastScenariosProps {
  pessimistic: number;
  likely: number;
  optimistic: number;
}

function formatAmount(n: number) {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(n);
}

export default function ForecastScenarios({
  pessimistic,
  likely,
  optimistic,
}: ForecastScenariosProps) {
  const scenarios = [
    {
      label: "متفائل",
      value: optimistic,
      color: "var(--sage)",
      bg: "rgba(107,142,107,0.1)",
      icon: "📈",
    },
    {
      label: "محتمل",
      value: likely,
      color: "var(--amber)",
      bg: "rgba(200,133,58,0.12)",
      icon: "📊",
      isMain: true,
    },
    {
      label: "متشائم",
      value: pessimistic,
      color: "var(--rose)",
      bg: "rgba(184,92,92,0.1)",
      icon: "📉",
    },
  ];

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {scenarios.map((s) => (
        <div
          key={s.label}
          className="rounded-2xl px-3 py-3.5 flex flex-col items-center gap-1.5 transition-all"
          style={{
            background: s.isMain ? s.bg : "var(--paper-2)",
            border: s.isMain ? `1.5px solid ${s.color}40` : "1px solid var(--line)",
          }}
        >
          <span className="text-[18px]">{s.icon}</span>
          <span
            className="text-[10.5px] font-heading opacity-60"
            style={{ color: "var(--ink)" }}
          >
            {s.label}
          </span>
          <span
            className="font-numbers text-[14px] font-bold leading-tight text-center"
            style={{ color: s.color }}
          >
            {formatAmount(s.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
