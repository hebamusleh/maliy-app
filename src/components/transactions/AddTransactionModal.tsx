"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { CardLink, Project, CreateTransactionForm } from "@/types/project";

const CURRENCIES = [
  "SAR", "USD", "EUR", "GBP", "AED", "KWD", "BHD",
  "QAR", "OMR", "JOD", "EGP", "JPY", "CNY", "INR", "TRY",
];

interface AddTransactionModalProps {
  projects: Project[];
  onClose: () => void;
}

function defaultForm(baseCurrency = "SAR"): CreateTransactionForm {
  return {
    merchant: "",
    amount: 0,
    currency_original: baseCurrency,
    date: new Date().toISOString().slice(0, 10),
    transaction_time: "",
    payment_last4: "",
    notes: "",
    project_id: "",
  };
}

async function createTransaction(form: CreateTransactionForm) {
  const res = await fetch("/api/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(form),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "فشل إنشاء المعاملة");
  }
  return res.json();
}

function formatCard(card: CardLink) {
  const network = card.card_network ?? "";
  const bank = card.bank_name ?? "";
  const type = card.card_type === "debit" ? "مدين" : "ائتماني";
  const expiry =
    card.expiry_month && card.expiry_year
      ? ` · ${String(card.expiry_month).padStart(2, "0")}/${card.expiry_year}`
      : "";
  const meta = [network, bank, type].filter(Boolean).join(" · ");
  return `•••• ${card.last4}${expiry}${meta ? `  (${meta})` : ""}`;
}

export default function AddTransactionModal({ projects, onClose }: AddTransactionModalProps) {
  const queryClient = useQueryClient();

  const { data: settingsData } = useQuery<{ settings: { base_currency: string } }>({
    queryKey: ["settings"],
    queryFn: async () => {
      const res = await fetch("/api/settings");
      if (!res.ok) return { settings: { base_currency: "SAR" } };
      return res.json();
    },
    staleTime: 60_000,
  });
  const baseCurrency = settingsData?.settings?.base_currency ?? "SAR";

  const [form, setForm] = useState<CreateTransactionForm>(() => ({
    ...defaultForm(),
    project_id: projects.length === 1 ? projects[0].id : "",
  }));

  // Sync currency_original default when settings load
  useEffect(() => {
    setForm((f) => ({
      ...f,
      currency_original: f.currency_original === "SAR" ? baseCurrency : f.currency_original,
    }));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseCurrency]);
  const [manualLast4, setManualLast4] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  // Fetch linked cards for the selected project
  const { data: cardLinksData } = useQuery<{ cardLinks: CardLink[] }>({
    queryKey: ["cardLinks", form.project_id],
    queryFn: async () => {
      if (!form.project_id) return { cardLinks: [] };
      const res = await fetch(`/api/projects/${form.project_id}/cards`);
      if (!res.ok) return { cardLinks: [] };
      return res.json();
    },
    enabled: !!form.project_id,
    staleTime: 60_000,
  });

  const linkedCards = cardLinksData?.cardLinks ?? [];

  // When project changes, reset card selection
  useEffect(() => {
    setForm((f) => ({ ...f, payment_last4: "" }));
    setManualLast4(false);
  }, [form.project_id]);

  const mutation = useMutation({
    mutationFn: createTransaction,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      toast.success("تمت إضافة المعاملة");
      onClose();
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const set = <K extends keyof CreateTransactionForm>(k: K, v: CreateTransactionForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: CreateTransactionForm = {
      ...form,
      amount: Number(form.amount),
      transaction_time: form.transaction_time || undefined,
      payment_last4: form.payment_last4 || undefined,
      notes: form.notes || undefined,
    };
    mutation.mutate(payload);
  };

  const inputStyle = {
    background: "var(--paper-3)",
    border: "1px solid var(--line)",
    color: "var(--ink)",
    borderRadius: 12,
    padding: "10px 14px",
    fontSize: 14,
    fontFamily: "inherit",
    width: "100%",
    outline: "none",
  } as const;

  const labelStyle = {
    fontSize: 12,
    fontFamily: "var(--font-heading)",
    color: "var(--ink)",
    opacity: 0.6,
    display: "block",
    marginBottom: 6,
  } as const;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(14,27,44,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{ background: "var(--paper)", border: "1px solid var(--line)", boxShadow: "var(--shadow-lg)" }}
      >
        {/* Header */}
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ background: "var(--ink)", color: "var(--paper)" }}
        >
          <p className="font-heading text-[17px] font-bold">إضافة معاملة</p>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-[13px] transition-opacity hover:opacity-60"
            style={{ background: "rgba(255,255,255,0.1)" }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          {/* Merchant */}
          <div>
            <label style={labelStyle}>الجهة / التاجر *</label>
            <input
              style={inputStyle}
              value={form.merchant}
              onChange={(e) => set("merchant", e.target.value)}
              placeholder="مثال: نون، كارفور..."
              required
              dir="rtl"
            />
          </div>

          {/* Amount + Currency */}
          <div>
            <label style={labelStyle}>المبلغ *</label>
            <div className="flex gap-2">
              <input
                style={{ ...inputStyle, flex: 1 }}
                type="number"
                value={form.amount || ""}
                onChange={(e) => set("amount", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                step="0.01"
                required
                dir="ltr"
              />
              <select
                style={{ ...inputStyle, width: "auto", minWidth: 80, flex: "0 0 auto" }}
                value={form.currency_original ?? "SAR"}
                onChange={(e) => set("currency_original", e.target.value)}
                dir="ltr"
              >
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            {(form.currency_original && form.currency_original !== baseCurrency) && (
              <p
                className="text-[11px] mt-1.5 opacity-55"
                style={{ color: "var(--ink)", fontFamily: "var(--font-heading)" }}
              >
                سيتم تحويل المبلغ إلى {baseCurrency} تلقائياً عند الحفظ
              </p>
            )}
          </div>

          {/* Date */}
          <div>
            <label style={labelStyle}>التاريخ *</label>
            <input
              style={inputStyle}
              type="date"
              value={form.date}
              onChange={(e) => set("date", e.target.value)}
              required
              dir="ltr"
            />
          </div>

          {/* Time */}
          <div>
            <label style={labelStyle}>الوقت</label>
            <input
              style={inputStyle}
              type="time"
              value={form.transaction_time ?? ""}
              onChange={(e) => set("transaction_time", e.target.value)}
              dir="ltr"
            />
          </div>

          {/* Project */}
          <div>
            <label style={labelStyle}>المشروع *</label>
            <select
              style={inputStyle}
              value={form.project_id}
              onChange={(e) => set("project_id", e.target.value)}
              required
            >
              <option value="">اختر المشروع</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.icon} {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Card selection */}
          {form.project_id && (
            <div>
              <label style={labelStyle}>البطاقة المستخدمة</label>
              {linkedCards.length > 0 && !manualLast4 ? (
                <div className="flex flex-col gap-2">
                  <select
                    style={inputStyle}
                    value={form.payment_last4 ?? ""}
                    onChange={(e) => set("payment_last4", e.target.value)}
                    dir="rtl"
                  >
                    <option value="">بدون بطاقة</option>
                    {linkedCards.map((card) => (
                      <option key={card.id} value={card.last4}>
                        {formatCard(card)}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setManualLast4(true)}
                    className="text-[11px] text-start underline opacity-50 hover:opacity-80"
                    style={{ color: "var(--ink)" }}
                  >
                    إدخال رقم يدوياً
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  <input
                    style={inputStyle}
                    value={form.payment_last4 ?? ""}
                    onChange={(e) => set("payment_last4", e.target.value.slice(0, 4))}
                    placeholder="آخر 4 أرقام"
                    maxLength={4}
                    inputMode="numeric"
                    dir="ltr"
                  />
                  {linkedCards.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setManualLast4(false)}
                      className="text-[11px] text-start underline opacity-50 hover:opacity-80"
                      style={{ color: "var(--ink)" }}
                    >
                      اختر من البطاقات المرتبطة
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label style={labelStyle}>ملاحظات</label>
            <textarea
              style={{ ...inputStyle, resize: "none", height: 72 }}
              value={form.notes ?? ""}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="أي تفاصيل إضافية..."
              dir="rtl"
            />
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full py-3 rounded-2xl font-heading font-semibold text-[14px] transition-opacity hover:opacity-90 disabled:opacity-60 active:scale-[0.99]"
            style={{ background: "var(--ink)", color: "var(--amber-2)" }}
          >
            {mutation.isPending ? "جارٍ الحفظ..." : "حفظ المعاملة"}
          </button>
        </form>
      </div>
    </div>
  );
}
