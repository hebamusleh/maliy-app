"use client";

import type { Transaction } from "@/types/project";
import TransactionItem from "./TransactionItem";

type TxWithJoins = Transaction & {
  project?: { id: string; name: string; icon: string; type: string } | null;
  category?: { id: string; name_ar: string; icon: string; color: string } | null;
};

interface TransactionListProps {
  transactions: TxWithJoins[];
  isLoading: boolean;
  onTransactionClick: (tx: Transaction) => void;
}

function groupByDate(txs: TxWithJoins[]): Map<string, TxWithJoins[]> {
  const map = new Map<string, TxWithJoins[]>();
  for (const tx of txs) {
    const key = tx.date;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(tx);
  }
  return map;
}

function formatDateHeader(dateStr: string) {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "اليوم";
  if (d.toDateString() === yesterday.toDateString()) return "أمس";
  return d.toLocaleDateString("ar-SA", { weekday: "long", month: "long", day: "numeric" });
}

export default function TransactionList({
  transactions,
  isLoading,
  onTransactionClick,
}: TransactionListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-2xl animate-pulse"
            style={{ background: "var(--paper-3)" }}
          />
        ))}
      </div>
    );
  }

  if (!transactions.length) {
    return (
      <div
        className="flex flex-col items-center justify-center gap-3 py-16 rounded-3xl"
        style={{ background: "var(--paper-2)", border: "1px solid var(--line)" }}
      >
        <span className="text-[40px]">🔍</span>
        <p className="font-heading text-[15px] font-semibold opacity-60" style={{ color: "var(--ink)" }}>
          لا توجد معاملات
        </p>
      </div>
    );
  }

  const groups = groupByDate(transactions);

  return (
    <div className="flex flex-col gap-5">
      {Array.from(groups.entries()).map(([date, txs]) => (
        <div key={date}>
          {/* Date header */}
          <div className="flex items-center gap-3 mb-2.5">
            <span
              className="text-[12px] font-heading font-semibold opacity-55"
              style={{ color: "var(--ink)" }}
            >
              {formatDateHeader(date)}
            </span>
            <div className="flex-1 h-px" style={{ background: "var(--line)" }} />
            <span
              className="text-[11px] font-heading opacity-40"
              style={{ color: "var(--ink)" }}
            >
              {new Intl.NumberFormat("ar-SA", {
                style: "currency",
                currency: "SAR",
                maximumFractionDigits: 0,
              }).format(txs.reduce((s, t) => s + t.amount, 0))}
            </span>
          </div>

          {/* Items */}
          <div className="flex flex-col gap-2">
            {txs.map((tx) => (
              <TransactionItem key={tx.id} transaction={tx} onClick={onTransactionClick} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
