"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

interface AddDebtForm {
  debtor_name: string;
  direction: "owed_by_me" | "owed_to_me";
  total_amount: number;
  due_date: string;
  notes: string;
  is_interest_free: boolean;
}

interface AddDebtModalProps {
  onClose: () => void;
}

async function createDebt(form: AddDebtForm) {
  const res = await fetch("/api/debts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...form,
      total_amount: Number(form.total_amount),
      due_date: form.due_date || null,
      notes: form.notes || null,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error ?? "فشل إنشاء الدين");
  }
  return res.json();
}

const defaultForm = (): AddDebtForm => ({
  debtor_name: "",
  direction: "owed_by_me",
  total_amount: 0,
  due_date: "",
  notes: "",
  is_interest_free: true,
});

export default function AddDebtModal({ onClose }: AddDebtModalProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<AddDebtForm>(defaultForm);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const mutation = useMutation({
    mutationFn: createDebt,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      toast.success("تمت إضافة الدين");
      onClose();
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const set = <K extends keyof AddDebtForm>(k: K, v: AddDebtForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

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
        <div
          className="px-6 py-4 flex items-center justify-between"
          style={{ background: "var(--ink)", color: "var(--paper)" }}
        >
          <p className="font-heading text-[17px] font-bold">إضافة دين</p>
          <button onClick={onClose} className="text-[13px] opacity-60 hover:opacity-100">✕</button>
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); mutation.mutate(form); }}
          className="px-6 py-5 flex flex-col gap-4"
        >
          <div>
            <label style={labelStyle}>الاسم *</label>
            <input
              style={inputStyle}
              value={form.debtor_name}
              onChange={(e) => set("debtor_name", e.target.value)}
              placeholder="اسم الشخص أو الجهة"
              required
              dir="rtl"
            />
          </div>

          {/* Direction toggle */}
          <div>
            <label style={labelStyle}>الاتجاه *</label>
            <div className="grid grid-cols-2 gap-2">
              {(["owed_by_me", "owed_to_me"] as const).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => set("direction", d)}
                  className="py-2.5 rounded-xl text-[13px] font-heading font-semibold transition-all"
                  style={{
                    background: form.direction === d ? "var(--ink)" : "var(--paper-3)",
                    color: form.direction === d ? "var(--paper)" : "var(--ink)",
                  }}
                >
                  {d === "owed_by_me" ? "مستحق عليّ" : "مستحق لي"}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>المبلغ (ريال) *</label>
              <input
                style={inputStyle}
                type="number"
                value={form.total_amount || ""}
                onChange={(e) => set("total_amount", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                step="0.01"
                required
                dir="ltr"
              />
            </div>
            <div>
              <label style={labelStyle}>تاريخ الاستحقاق</label>
              <input
                style={inputStyle}
                type="date"
                value={form.due_date}
                onChange={(e) => set("due_date", e.target.value)}
                dir="ltr"
              />
            </div>
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={form.is_interest_free}
              onChange={(e) => set("is_interest_free", e.target.checked)}
              className="w-4 h-4 rounded"
            />
            <span className="text-[13px] font-heading" style={{ color: "var(--ink)" }}>
              بدون فوائد
            </span>
          </label>

          <div>
            <label style={labelStyle}>ملاحظات</label>
            <textarea
              style={{ ...inputStyle, resize: "none", height: 64 }}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              placeholder="أي تفاصيل..."
              dir="rtl"
            />
          </div>

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full py-3 rounded-2xl font-heading font-semibold text-[14px] transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ background: "var(--ink)", color: "var(--amber-2)" }}
          >
            {mutation.isPending ? "جارٍ الحفظ..." : "حفظ"}
          </button>
        </form>
      </div>
    </div>
  );
}
