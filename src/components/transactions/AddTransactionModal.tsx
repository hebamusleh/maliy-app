"use client";

import { useState, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { Project } from "@/types/project";
import type { CreateTransactionForm } from "@/types/project";

interface AddTransactionModalProps {
  projects: Project[];
  onClose: () => void;
}

const defaultForm = (): CreateTransactionForm => ({
  merchant: "",
  amount: 0,
  date: new Date().toISOString().slice(0, 10),
  transaction_time: "",
  payment_last4: "",
  notes: "",
  project_id: "",
  category_id: "",
});

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

export default function AddTransactionModal({ projects, onClose }: AddTransactionModalProps) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateTransactionForm>(() => ({
    ...defaultForm(),
    project_id: projects.length === 1 ? projects[0].id : "",
  }));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>المبلغ (ريال) *</label>
              <input
                style={inputStyle}
                type="number"
                value={form.amount || ""}
                onChange={(e) => set("amount", parseFloat(e.target.value) || 0)}
                placeholder="0.00"
                step="0.01"
                required
                dir="ltr"
              />
            </div>
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
          </div>

          <div className="grid grid-cols-2 gap-3">
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
            <div>
              <label style={labelStyle}>آخر 4 أرقام البطاقة</label>
              <input
                style={inputStyle}
                value={form.payment_last4 ?? ""}
                onChange={(e) => set("payment_last4", e.target.value.slice(0, 4))}
                placeholder="1234"
                maxLength={4}
                dir="ltr"
              />
            </div>
          </div>

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
