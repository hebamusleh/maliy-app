"use client";

import type { Transaction } from "@/types/project";
import ConfidenceMeter from "./ConfidenceMeter";

interface TransactionItemProps {
  transaction: Transaction & {
    project?: { id: string; name: string; icon: string; type: string } | null;
    category?: { id: string; name_ar: string; icon: string; color: string } | null;
  };
  onClick: (tx: Transaction) => void;
}

function formatAmount(amount: number) {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0,
  }).format(amount);
}

const STATUS_LABEL: Record<string, string> = {
  classified: "مُصنَّفة",
  pending: "معلّقة",
  skipped: "متخطّاة",
};

export default function TransactionItem({ transaction, onClick }: TransactionItemProps) {
  const isPending = transaction.status === "pending";

  return (
    <button
      onClick={() => onClick(transaction)}
      className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-2xl text-start transition-all hover:opacity-90 active:scale-[0.99]"
      style={{
        background: "var(--paper-2)",
        border: isPending ? "1px solid rgba(200,133,58,0.35)" : "1px solid var(--line)",
      }}
    >
      {/* Project icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-[19px] flex-shrink-0"
        style={{
          background: transaction.project ? "var(--paper-3)" : "rgba(200,133,58,0.12)",
        }}
      >
        {transaction.project?.icon ?? "❓"}
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p
            className="font-heading text-[14px] font-semibold truncate"
            style={{ color: "var(--ink)" }}
          >
            {transaction.merchant ?? "—"}
          </p>
          {isPending && (
            <span
              className="text-[10px] font-heading px-1.5 py-0.5 rounded-full flex-shrink-0"
              style={{ background: "rgba(200,133,58,0.15)", color: "var(--amber)" }}
            >
              معلّقة
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {transaction.project && (
            <span className="text-[12px] opacity-55 font-heading truncate" style={{ color: "var(--ink)" }}>
              {transaction.project.name}
            </span>
          )}
          {transaction.category && (
            <>
              <span className="opacity-30" style={{ color: "var(--ink)" }}>·</span>
              <span className="text-[12px] opacity-55 font-heading" style={{ color: "var(--ink)" }}>
                {transaction.category.name_ar}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Amount + confidence */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span
          className="font-numbers text-[15px] font-bold"
          style={{ color: transaction.amount < 0 ? "var(--rose)" : "var(--ink)" }}
        >
          {formatAmount(transaction.amount)}
        </span>
        {transaction.confidence_score !== null && transaction.confidence_score !== undefined && (
          <ConfidenceMeter score={transaction.confidence_score} size="sm" />
        )}
      </div>
    </button>
  );
}
