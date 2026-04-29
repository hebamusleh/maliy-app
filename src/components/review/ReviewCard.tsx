"use client";

import { useState } from "react";
import type { Transaction } from "@/types/project";
import type { Project } from "@/types/project";
import ReviewProgressPips from "./ReviewProgressPips";
import ProjectChoicePicker from "./ProjectChoicePicker";

interface ReviewCardProps {
  transaction: Transaction;
  projects: Project[];
  suggestedProjectId: string | null;
  onClassify: (projectId: string, applyToMerchant: boolean) => void;
  onSkip: () => void;
  totalCount: number;
  currentIndex: number;
  completedIndices: number[];
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("ar-SA", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default function ReviewCard({
  transaction,
  projects,
  suggestedProjectId,
  onClassify,
  onSkip,
  totalCount,
  currentIndex,
  completedIndices,
}: ReviewCardProps) {
  const [applyToMerchant, setApplyToMerchant] = useState(true);

  const confidencePct = transaction.confidence_score
    ? Math.round(transaction.confidence_score * 100)
    : null;

  return (
    <div
      className="rounded-3xl overflow-hidden"
      style={{
        background: "var(--paper-2)",
        border: "1px solid var(--line)",
        boxShadow: "var(--shadow-lg)",
      }}
    >
      {/* Header bar */}
      <div
        className="px-6 pt-5 pb-4"
        style={{ background: "var(--ink)", color: "var(--paper)" }}
      >
        <div className="flex items-center justify-between mb-4">
          <span className="text-[13px] font-heading opacity-60">
            {currentIndex + 1} من {totalCount}
          </span>
          <ReviewProgressPips
            total={totalCount}
            current={currentIndex}
            completed={completedIndices}
          />
        </div>

        {/* Merchant + amount */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-heading text-[22px] font-bold leading-snug">
              {transaction.merchant ?? "—"}
            </h2>
            {transaction.payment_last4 && (
              <p className="text-[12px] opacity-50 mt-0.5 font-heading">
                •••• {transaction.payment_last4}
              </p>
            )}
          </div>
          <div className="text-end flex-shrink-0">
            <p
              className="font-numbers text-[28px] font-bold leading-none"
              style={{ color: "var(--amber-2)" }}
            >
              {formatAmount(transaction.amount)}
            </p>
            <p className="text-[12px] opacity-50 mt-1 font-heading">
              {formatDate(transaction.date)}
              {transaction.transaction_time && (
                <> · {transaction.transaction_time.slice(0, 5)}</>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-6 py-5 flex flex-col gap-5">
        {/* AI reasoning / suggestion banner */}
        {transaction.ai_reasoning && (
          <div
            className="rounded-2xl px-4 py-3 flex items-start gap-3"
            style={{
              background: "rgba(200,133,58,0.12)",
              border: "1px solid rgba(200,133,58,0.25)",
            }}
          >
            <span className="text-[18px] flex-shrink-0 mt-0.5">🤖</span>
            <div>
              <p className="text-[12.5px] leading-relaxed" style={{ color: "var(--ink)" }}>
                {transaction.ai_reasoning}
              </p>
              {confidencePct !== null && (
                <p
                  className="text-[11px] font-heading mt-1 font-semibold"
                  style={{ color: "var(--amber)" }}
                >
                  {confidencePct}% احتمالية
                </p>
              )}
            </div>
          </div>
        )}

        {/* Project picker */}
        <div>
          <p
            className="text-[12px] font-heading font-semibold mb-3 opacity-60"
            style={{ color: "var(--ink)" }}
          >
            اختر مشروعاً:
          </p>
          <ProjectChoicePicker
            projects={projects}
            suggestedProjectId={suggestedProjectId}
            onClassify={onClassify}
            applyToMerchant={applyToMerchant}
          />
        </div>

        {/* Apply-to-merchant toggle */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <div
            className="w-10 h-5.5 rounded-full relative transition-colors duration-200 flex-shrink-0"
            style={{
              background: applyToMerchant ? "var(--sage)" : "var(--paper-3)",
            }}
            onClick={() => setApplyToMerchant((v) => !v)}
          >
            <div
              className="absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200"
              style={{
                background: "white",
                right: applyToMerchant ? 2 : "auto",
                left: applyToMerchant ? "auto" : 2,
                boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
              }}
            />
          </div>
          <span
            className="text-[12.5px] font-heading"
            style={{ color: "var(--ink)", opacity: 0.75 }}
          >
            تطبيق على كل معاملات &quot;{transaction.merchant}&quot;
          </span>
        </label>

        {/* Skip button */}
        <button
          onClick={onSkip}
          className="w-full py-3 rounded-2xl text-[13px] font-heading font-semibold transition-opacity hover:opacity-70 active:scale-98"
          style={{
            background: "var(--paper-3)",
            color: "var(--ink)",
            opacity: 0.7,
          }}
        >
          تخطّ هذه المرة
        </button>
      </div>
    </div>
  );
}
