"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

interface Settings {
  base_currency: string;
}

interface SettingsResponse {
  settings: Settings;
  supported_currencies: string[];
}

const CURRENCY_LABELS: Record<string, string> = {
  SAR: "ريال سعودي",
  USD: "دولار أمريكي",
  EUR: "يورو",
  GBP: "جنيه إسترليني",
  AED: "درهم إماراتي",
  KWD: "دينار كويتي",
  BHD: "دينار بحريني",
  QAR: "ريال قطري",
  OMR: "ريال عُماني",
  JOD: "دينار أردني",
  EGP: "جنيه مصري",
  JPY: "ين ياباني",
  CNY: "يوان صيني",
  INR: "روبية هندية",
  TRY: "ليرة تركية",
};

export default function SettingsPage() {
  const queryClient = useQueryClient();

  // Profile state (local-only for now)
  const [name, setName] = useState("سارة المنصور");
  const [email, setEmail] = useState("sara@example.com");
  const [phone, setPhone] = useState("+966 50 000 0000");
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.9);
  const [silentAutoClassify, setSilentAutoClassify] = useState(false);

  // Base currency state
  const [baseCurrency, setBaseCurrency] = useState("SAR");

  const { data, isLoading: settingsLoading } = useQuery<SettingsResponse>({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("فشل تحميل الإعدادات");
      return res.json();
    },
    staleTime: 60_000,
  });

  // Sync fetched base currency into local state
  useEffect(() => {
    if (data?.settings?.base_currency) {
      setBaseCurrency(data.settings.base_currency);
    }
  }, [data]);

  const currencies = data?.supported_currencies ?? Object.keys(CURRENCY_LABELS);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base_currency: baseCurrency }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error ?? "فشل الحفظ");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings"] });
      // Invalidate all analytics so they refetch with the new currency
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("تم حفظ الإعدادات");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const inputStyle = {
    background: "var(--paper)",
    border: "1px solid var(--line-strong)",
    color: "var(--ink)",
    borderRadius: 12,
    padding: "12px 16px",
    fontSize: 14,
    fontFamily: "inherit",
    width: "100%",
    outline: "none",
  } as const;

  const labelStyle = {
    display: "block",
    fontSize: 12,
    fontFamily: "var(--font-heading)",
    fontWeight: 600,
    color: "var(--ink)",
    opacity: 0.6,
    marginBottom: 6,
  } as const;

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-heading text-[26px] font-bold" style={{ color: "var(--ink)" }}>
        الإعدادات
      </h1>

      {/* ─── Currency settings ─────────────────────────────── */}
      <div
        className="rounded-3xl p-6"
        style={{
          background: "var(--paper-2)",
          border: "1px solid var(--line)",
          boxShadow: "var(--shadow)",
        }}
      >
        <h2 className="font-heading text-[17px] font-bold mb-1" style={{ color: "var(--ink)" }}>
          العملة الأساسية
        </h2>
        <p className="text-[12px] opacity-55 mb-5" style={{ color: "var(--ink)" }}>
          جميع التحليلات والتقارير والمساعد الذكي ستعرض الأرقام بهذه العملة. تُحوَّل المعاملات
          بالعملات الأخرى تلقائياً.
        </p>

        {settingsLoading ? (
          <div
            className="h-12 rounded-xl animate-pulse"
            style={{ background: "var(--paper-3)" }}
          />
        ) : (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {currencies.map((code) => {
                const isSelected = baseCurrency === code;
                return (
                  <button
                    key={code}
                    onClick={() => setBaseCurrency(code)}
                    className="rounded-2xl px-3 py-3 text-start transition-all"
                    style={{
                      background: isSelected ? "var(--ink)" : "var(--paper)",
                      border: isSelected
                        ? "1.5px solid var(--ink)"
                        : "1px solid var(--line)",
                      color: isSelected ? "var(--paper)" : "var(--ink)",
                    }}
                  >
                    <span
                      className="block font-numbers font-bold text-[15px]"
                      style={{ color: isSelected ? "var(--amber)" : "var(--ink)" }}
                    >
                      {code}
                    </span>
                    <span
                      className="block font-heading text-[11px] mt-0.5"
                      style={{ opacity: isSelected ? 0.75 : 0.5 }}
                    >
                      {CURRENCY_LABELS[code] ?? code}
                    </span>
                  </button>
                );
              })}
            </div>

            {baseCurrency !== data?.settings?.base_currency && (
              <p
                className="text-[12px] font-heading px-1"
                style={{ color: "var(--amber)" }}
              >
                ستُطبَّق التغييرات على جميع التحليلات فور الحفظ.
              </p>
            )}
          </div>
        )}
      </div>

      {/* ─── Profile card ──────────────────────────────────── */}
      <div
        className="rounded-3xl p-6"
        style={{
          background: "var(--paper-2)",
          border: "1px solid var(--line)",
          boxShadow: "var(--shadow)",
        }}
      >
        <h2 className="font-heading text-[17px] font-bold mb-5" style={{ color: "var(--ink)" }}>
          الملف الشخصي
        </h2>

        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center font-heading font-bold text-[22px]"
            style={{ background: "linear-gradient(135deg, #E0A050, #B85C5C)", color: "var(--ink)" }}
          >
            {name.charAt(0)}
          </div>
          <div>
            <p className="font-heading font-semibold text-[15px]" style={{ color: "var(--ink)" }}>
              {name}
            </p>
            <p className="text-[12px] opacity-55" style={{ color: "var(--ink)" }}>
              الباقة الذهبية
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label style={labelStyle}>الاسم</label>
            <input value={name} onChange={(e) => setName(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>البريد الإلكتروني</label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              dir="ltr"
              style={{ ...inputStyle, textAlign: "end" }}
            />
          </div>
          <div>
            <label style={labelStyle}>رقم الهاتف</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              dir="ltr"
              style={{ ...inputStyle, textAlign: "end" }}
            />
          </div>
        </div>
      </div>

      {/* ─── Classification settings ───────────────────────── */}
      <div
        className="rounded-3xl p-6"
        style={{
          background: "var(--paper-2)",
          border: "1px solid var(--line)",
          boxShadow: "var(--shadow)",
        }}
      >
        <h2 className="font-heading text-[17px] font-bold mb-5" style={{ color: "var(--ink)" }}>
          إعدادات التصنيف
        </h2>

        <div className="flex flex-col gap-5">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="font-heading text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
                حد الثقة للتصنيف التلقائي
              </label>
              <span className="font-numbers text-[15px] font-medium" style={{ color: "var(--amber)" }}>
                {Math.round(confidenceThreshold * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.5}
              max={1}
              step={0.05}
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
              className="w-full"
              style={{ accentColor: "var(--amber)" }}
            />
            <p className="text-[11.5px] opacity-50 mt-1.5" style={{ color: "var(--ink)" }}>
              المعاملات التي تتجاوز هذا الحد تُصنَّف تلقائياً دون مراجعة
            </p>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-heading text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
                التصنيف الصامت
              </p>
              <p className="text-[11.5px] opacity-50 mt-0.5" style={{ color: "var(--ink)" }}>
                صنّف تلقائياً بدون إشعارات
              </p>
            </div>
            <button
              onClick={() => setSilentAutoClassify(!silentAutoClassify)}
              className="w-12 h-6 rounded-full transition-all relative"
              style={{
                background: silentAutoClassify ? "var(--sage)" : "var(--paper-3)",
                border: "1px solid var(--line-strong)",
              }}
              aria-checked={silentAutoClassify}
              role="switch"
            >
              <span
                className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                style={{
                  background: "var(--paper)",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                  insetInlineStart: silentAutoClassify ? "calc(100% - 22px)" : "2px",
                }}
              />
            </button>
          </div>
        </div>
      </div>

      {/* ─── Subscription ──────────────────────────────────── */}
      <div
        className="rounded-3xl p-6"
        style={{ background: "linear-gradient(135deg, var(--ink), var(--ink-2))", color: "var(--paper)" }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-[17px] font-bold mb-1">الاشتراك</h2>
            <p className="text-[13px] opacity-60">الباقة الذهبية · تنتهي في 2026/12/31</p>
          </div>
          <div
            className="px-4 py-2 rounded-xl font-heading text-[13px] font-semibold"
            style={{ background: "var(--amber)", color: "var(--ink)" }}
          >
            ذهبية
          </div>
        </div>
      </div>

      {/* ─── Save button ───────────────────────────────────── */}
      <button
        onClick={() => saveMutation.mutate()}
        disabled={saveMutation.isPending}
        className="w-full py-3.5 rounded-2xl font-heading text-[15px] font-bold transition-all active:scale-[0.98] disabled:opacity-60"
        style={{ background: "var(--ink)", color: "var(--amber-2)" }}
      >
        {saveMutation.isPending ? "جارٍ الحفظ..." : "حفظ الإعدادات"}
      </button>
    </div>
  );
}
