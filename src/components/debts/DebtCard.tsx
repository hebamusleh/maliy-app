"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import type { Debt } from "@/types/index";

interface DebtCardProps {
  debt: Debt;
}

function formatAmount(n: number) {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(n);
}

async function deleteDebt(id: string) {
  const res = await fetch(`/api/debts/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error("Delete failed");
}

async function markUrgent(id: string, is_urgent: boolean) {
  const res = await fetch(`/api/debts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ is_urgent }),
  });
  if (!res.ok) throw new Error("Update failed");
  return res.json();
}

export default function DebtCard({ debt }: DebtCardProps) {
  const queryClient = useQueryClient();
  const isOwedByMe = debt.direction === "owed_by_me";
  const accentColor = isOwedByMe ? "var(--rose)" : "var(--sage)";

  const paidPct = debt.total_amount > 0
    ? ((debt.total_amount - debt.remaining_amount) / debt.total_amount) * 100
    : 0;

  const deleteMutation = useMutation({
    mutationFn: () => deleteDebt(debt.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["debts"] });
      toast.success("تم حذف الدين");
    },
    onError: () => toast.error("فشل الحذف"),
  });

  const urgentMutation = useMutation({
    mutationFn: () => markUrgent(debt.id, !debt.is_urgent),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["debts"] }),
    onError: () => toast.error("فشل التحديث"),
  });

  const isOverdue =
    debt.due_date && new Date(debt.due_date) < new Date() && debt.remaining_amount > 0;

  return (
    <div
      className="rounded-2xl px-4 py-4 flex flex-col gap-3 relative overflow-hidden"
      style={{
        background: "var(--paper-2)",
        border: debt.is_urgent
          ? `1.5px solid ${accentColor}50`
          : "1px solid var(--line)",
      }}
    >
      {/* Accent bar */}
      <div
        className="absolute inset-y-0 end-0 w-1 rounded-sm"
        style={{ background: accentColor }}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p
              className="font-heading text-[15px] font-semibold"
              style={{ color: "var(--ink)" }}
            >
              {debt.debtor_name}
            </p>
            {debt.is_urgent && (
              <span
                className="text-[10px] font-heading px-1.5 py-0.5 rounded-full"
                style={{ background: "rgba(184,92,92,0.15)", color: "var(--rose)" }}
              >
                عاجل
              </span>
            )}
            {isOverdue && (
              <span
                className="text-[10px] font-heading px-1.5 py-0.5 rounded-full"
                style={{ background: "rgba(184,92,92,0.15)", color: "var(--rose)" }}
              >
                متأخر
              </span>
            )}
            {debt.is_interest_free && (
              <span
                className="text-[10px] font-heading px-1.5 py-0.5 rounded-full"
                style={{ background: "rgba(107,142,107,0.15)", color: "var(--sage)" }}
              >
                بلا فوائد
              </span>
            )}
          </div>
          <p
            className="text-[12px] font-heading opacity-55 mt-0.5"
            style={{ color: "var(--ink)" }}
          >
            {isOwedByMe ? "مستحق عليّ" : "مستحق لي"}
            {debt.due_date && (
              <> · {new Date(debt.due_date).toLocaleDateString("ar-SA")}</>
            )}
          </p>
        </div>
        <div className="text-end flex-shrink-0">
          <p
            className="font-numbers text-[18px] font-bold"
            style={{ color: accentColor }}
          >
            {formatAmount(debt.remaining_amount)}
          </p>
          {debt.remaining_amount !== debt.total_amount && (
            <p
              className="text-[11px] font-heading opacity-45 line-through"
              style={{ color: "var(--ink)" }}
            >
              {formatAmount(debt.total_amount)}
            </p>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {paidPct > 0 && (
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--paper-3)" }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${paidPct}%`, background: "var(--sage)" }}
          />
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => urgentMutation.mutate()}
          disabled={urgentMutation.isPending}
          className="text-[11.5px] font-heading px-2.5 py-1.5 rounded-xl transition-opacity hover:opacity-70"
          style={{
            background: debt.is_urgent ? "rgba(184,92,92,0.12)" : "var(--paper-3)",
            color: debt.is_urgent ? "var(--rose)" : "var(--ink)",
          }}
        >
          {debt.is_urgent ? "إزالة العجلة" : "تحديد كعاجل"}
        </button>
        <button
          onClick={() => {
            if (confirm("هل تريد حذف هذا الدين؟")) deleteMutation.mutate();
          }}
          disabled={deleteMutation.isPending}
          className="text-[11.5px] font-heading px-2.5 py-1.5 rounded-xl transition-opacity hover:opacity-70 ms-auto"
          style={{ background: "var(--paper-3)", color: "var(--rose)" }}
        >
          حذف
        </button>
      </div>
    </div>
  );
}
