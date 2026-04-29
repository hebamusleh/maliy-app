"use client";

interface BalanceCardProps {
  balance: number;
  income: number;
  expenses: number;
  savings: number;
  pendingCount: number;
  changePercent: number;
}

const fmt = (n: number) =>
  new Intl.NumberFormat("ar-SA", { minimumFractionDigits: 0 }).format(
    Math.round(n)
  );

export default function BalanceCard({
  balance,
  income,
  expenses,
  savings,
  pendingCount,
  changePercent,
}: BalanceCardProps) {
  return (
    <section
      className="rounded-3xl p-8 relative overflow-hidden"
      style={{
        background: "var(--ink)",
        color: "var(--paper)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      {/* Ambient glows */}
      <div
        className="absolute pointer-events-none"
        style={{
          top: -100,
          insetInlineStart: -100,
          width: 400,
          height: 400,
          background: "radial-gradient(circle, rgba(224,160,80,0.18), transparent 60%)",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          bottom: -50,
          insetInlineEnd: -100,
          width: 350,
          height: 350,
          background: "radial-gradient(circle, rgba(184,92,92,0.10), transparent 60%)",
        }}
      />

      <div className="grid relative z-10" style={{ gridTemplateColumns: "1.4fr 1fr", gap: 32 }}>
        {/* Balance */}
        <div>
          <div className="text-[12px] tracking-widest opacity-55 mb-2">
            صافي الرصيد لهذا الشهر
          </div>
          <div className="font-numbers leading-none" style={{ fontSize: 56, letterSpacing: -2 }}>
            {fmt(balance)}
            <span
              className="font-body text-[24px] opacity-60 ms-2 align-top"
              style={{ verticalAlign: "top" }}
            >
              ر.س
            </span>
          </div>
          {changePercent !== 0 && (
            <div
              className="inline-flex items-center gap-1.5 mt-3.5 px-3 py-1.5 rounded-full text-[13px] font-heading"
              style={{
                background:
                  changePercent > 0
                    ? "rgba(107,142,107,0.18)"
                    : "rgba(184,92,92,0.18)",
                color: changePercent > 0 ? "#9CC09C" : "#E89595",
              }}
            >
              <svg
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                viewBox="0 0 24 24"
              >
                {changePercent > 0 ? (
                  <path d="M7 17l5-5 5 5M7 7h10v10" />
                ) : (
                  <path d="M7 7l5 5 5-5M7 17h10V7" />
                )}
              </svg>
              {changePercent > 0 ? "+" : ""}
              {changePercent}٪ مقارنة بالشهر الماضي
            </div>
          )}
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 gap-3.5 content-start">
          {[
            { label: "الدخل", value: `+${fmt(income)}`, pos: true },
            { label: "المصاريف", value: `−${fmt(expenses)}`, neg: true },
            { label: "ادخار", value: fmt(savings) },
            {
              label: "معلّق",
              value: `${pendingCount} معاملات`,
              amber: pendingCount > 0,
            },
          ].map(({ label, value, pos, neg, amber }) => (
            <div
              key={label}
              className="rounded-xl p-3.5"
              style={{
                background: "rgba(244,239,230,0.05)",
                border: "1px solid rgba(244,239,230,0.08)",
              }}
            >
              <div className="text-[11px] opacity-55 tracking-wide">{label}</div>
              <div
                className="font-heading text-[22px] font-medium mt-1"
                style={{
                  color: pos
                    ? "#9CC09C"
                    : neg
                      ? "#E89595"
                      : amber
                        ? "var(--amber-soft)"
                        : "var(--paper)",
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
