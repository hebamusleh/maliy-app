"use client";

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import type { CardLink, Transaction } from "@/types/project";
import ConfidenceMeter from "./ConfidenceMeter";

interface TransactionDetailModalProps {
  transaction: (Transaction & {
    project?: { id: string; name: string; icon: string; type: string } | null;
    category?: { id: string; name_ar: string; icon: string; color: string } | null;
  }) | null;
  onClose: () => void;
  onClassify?: (projectId: string) => void;
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDateTime(date: string, time?: string | null) {
  const d = new Date(date).toLocaleDateString("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return time ? `${d} · ${time.slice(0, 5)}` : d;
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  classified: { label: "مُصنَّفة", color: "var(--sage)" },
  pending: { label: "معلّقة", color: "var(--amber)" },
  skipped: { label: "متخطّاة", color: "var(--rose)" },
};

export default function TransactionDetailModal({
  transaction,
  onClose,
}: TransactionDetailModalProps) {
  useEffect(() => {
    if (!transaction) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [transaction, onClose]);

  // Fetch linked cards to enrich payment_last4 display
  const { data: cardLinksData } = useQuery<{ cardLinks: CardLink[] }>({
    queryKey: ["cardLinks", transaction?.project_id],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${transaction!.project_id}/cards`);
      if (!res.ok) return { cardLinks: [] };
      return res.json();
    },
    enabled: !!transaction?.project_id && !!transaction?.payment_last4,
    staleTime: 5 * 60_000,
  });

  const matchedCard = cardLinksData?.cardLinks.find(
    (c) => c.last4 === transaction?.payment_last4
  ) ?? null;

  if (!transaction) return null;

  const statusInfo = STATUS_LABELS[transaction.status] ?? STATUS_LABELS.pending;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4"
      style={{ background: "rgba(14,27,44,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="w-full max-w-md rounded-3xl overflow-hidden"
        style={{
          background: "var(--paper)",
          boxShadow: "var(--shadow-lg)",
          border: "1px solid var(--line)",
        }}
      >
        {/* Header */}
        <div
          className="px-6 py-5 flex items-center justify-between"
          style={{ background: "var(--ink)", color: "var(--paper)" }}
        >
          <div>
            <p className="font-heading text-[20px] font-bold">
              {transaction.merchant ?? "—"}
            </p>
            {transaction.payment_last4 && (
              <p className="text-[12px] opacity-50 mt-0.5 font-heading">
                {matchedCard?.card_network ?? ""} •••• {transaction.payment_last4}
                {matchedCard?.bank_name ? ` · ${matchedCard.bank_name}` : ""}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-opacity hover:opacity-60"
            style={{ background: "rgba(255,255,255,0.1)", color: "var(--paper)" }}
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Amount */}
          <div className="flex items-center justify-between">
            <span className="text-[13px] opacity-60 font-heading" style={{ color: "var(--ink)" }}>
              المبلغ
            </span>
            <span
              className="font-numbers text-[24px] font-bold"
              style={{ color: "var(--ink)" }}
            >
              {formatAmount(transaction.amount)}
            </span>
          </div>

          {/* Date */}
          <div className="flex items-center justify-between">
            <span className="text-[13px] opacity-60 font-heading" style={{ color: "var(--ink)" }}>
              التاريخ
            </span>
            <span className="text-[13px] font-heading" style={{ color: "var(--ink)" }}>
              {formatDateTime(transaction.date, transaction.transaction_time)}
            </span>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between">
            <span className="text-[13px] opacity-60 font-heading" style={{ color: "var(--ink)" }}>
              الحالة
            </span>
            <span
              className="text-[12px] font-heading font-semibold px-2.5 py-1 rounded-full"
              style={{
                background: `${statusInfo.color}20`,
                color: statusInfo.color,
              }}
            >
              {statusInfo.label}
            </span>
          </div>

          {/* Card details */}
          {matchedCard && (
            <div className="flex items-center justify-between">
              <span className="text-[13px] opacity-60 font-heading" style={{ color: "var(--ink)" }}>
                البطاقة
              </span>
              <div className="flex flex-col items-end gap-0.5">
                <span className="text-[13px] font-heading font-semibold" style={{ color: "var(--ink)" }}>
                  {matchedCard.card_network ?? ""} •••• {matchedCard.last4}
                </span>
                {(matchedCard.bank_name || matchedCard.cardholder_name) && (
                  <span className="text-[11px] opacity-50 font-heading" style={{ color: "var(--ink)" }}>
                    {[matchedCard.bank_name, matchedCard.cardholder_name].filter(Boolean).join(" · ")}
                  </span>
                )}
                {matchedCard.expiry_month && matchedCard.expiry_year && (
                  <span className="text-[11px] opacity-40 font-heading" style={{ color: "var(--ink)" }}>
                    {String(matchedCard.expiry_month).padStart(2, "0")}/{matchedCard.expiry_year}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Project */}
          {transaction.project && (
            <div className="flex items-center justify-between">
              <span className="text-[13px] opacity-60 font-heading" style={{ color: "var(--ink)" }}>
                المشروع
              </span>
              <span className="text-[13px] font-heading font-semibold" style={{ color: "var(--ink)" }}>
                {transaction.project.icon} {transaction.project.name}
              </span>
            </div>
          )}

          {/* Category */}
          {transaction.category && (
            <div className="flex items-center justify-between">
              <span className="text-[13px] opacity-60 font-heading" style={{ color: "var(--ink)" }}>
                الفئة
              </span>
              <span className="text-[13px] font-heading" style={{ color: "var(--ink)" }}>
                {transaction.category.icon} {transaction.category.name_ar}
              </span>
            </div>
          )}

          {/* AI confidence */}
          {transaction.confidence_score !== null &&
            transaction.confidence_score !== undefined && (
              <div className="flex items-center justify-between">
                <span className="text-[13px] opacity-60 font-heading" style={{ color: "var(--ink)" }}>
                  ثقة الذكاء الاصطناعي
                </span>
                <ConfidenceMeter score={transaction.confidence_score} />
              </div>
            )}

          {/* AI reasoning */}
          {transaction.ai_reasoning && (
            <div
              className="rounded-2xl px-4 py-3"
              style={{ background: "var(--paper-3)" }}
            >
              <p
                className="text-[11px] font-heading font-semibold mb-1 opacity-60"
                style={{ color: "var(--ink)" }}
              >
                تفسير الذكاء الاصطناعي
              </p>
              <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--ink)" }}>
                {transaction.ai_reasoning}
              </p>
            </div>
          )}

          {/* Notes */}
          {transaction.notes && (
            <div>
              <p
                className="text-[11px] font-heading font-semibold mb-1 opacity-60"
                style={{ color: "var(--ink)" }}
              >
                ملاحظات
              </p>
              <p className="text-[13px]" style={{ color: "var(--ink)" }}>
                {transaction.notes}
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-2xl text-[13px] font-heading font-semibold transition-opacity hover:opacity-70"
            style={{ background: "var(--paper-3)", color: "var(--ink)" }}
          >
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
