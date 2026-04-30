"use client";

import { use, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { ProjectDashboard } from "@/types/project";
import ProjectDetailHero from "@/components/projects/ProjectDetailHero";
import TransactionList from "@/components/transactions/TransactionList";
import TransactionDetailModal from "@/components/transactions/TransactionDetailModal";
import type { Transaction } from "@/types/project";

async function fetchProjectDashboard(id: string): Promise<ProjectDashboard> {
  const res = await fetch(`/api/projects/${id}/dashboard`);
  if (!res.ok) throw new Error("Failed to fetch project");
  return res.json();
}

export default function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);

  const { data, isLoading } = useQuery<ProjectDashboard>({
    queryKey: ["project", id],
    queryFn: () => fetchProjectDashboard(id),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <div
          className="rounded-3xl animate-pulse"
          style={{ height: 200, background: "var(--paper-3)" }}
        />
        <div
          className="rounded-2xl animate-pulse"
          style={{ height: 300, background: "var(--paper-3)" }}
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div
        className="rounded-3xl flex flex-col items-center justify-center gap-3 py-16"
        style={{ background: "var(--paper-2)", border: "1px solid var(--line)" }}
      >
        <span className="text-[40px]">❌</span>
        <p
          className="font-heading text-[15px] font-semibold opacity-55"
          style={{ color: "var(--ink)" }}
        >
          المشروع غير موجود
        </p>
      </div>
    );
  }

  const { project, stats, recent_transactions } = data;

  return (
    <div className="flex flex-col gap-5">
      {/* Hero card */}
      <ProjectDetailHero project={project} stats={stats} />

      {/* AI Insights */}
      {data.insights && data.insights.length > 0 && (
        <div
          className="rounded-2xl p-4"
          style={{ background: "var(--paper-2)", border: "1px solid var(--line)" }}
        >
          <h2 className="font-heading text-[15px] font-bold mb-3" style={{ color: "var(--ink)" }}>
            رؤى ذكية
          </h2>
          <ul className="flex flex-col gap-2">
            {data.insights.map((insight, i) => (
              <li key={i} className="text-[13px] leading-relaxed" style={{ color: "var(--ink)" }}>
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Transactions */}
      <div>
        <h2
          className="font-heading text-[17px] font-bold mb-4"
          style={{ color: "var(--ink)" }}
        >
          المعاملات الأخيرة
        </h2>
        <TransactionList
          transactions={recent_transactions}
          isLoading={false}
          onTransactionClick={(tx) => setSelectedTx(tx)}
        />
      </div>

      {selectedTx && (
        <TransactionDetailModal
          transaction={selectedTx}
          onClose={() => setSelectedTx(null)}
        />
      )}
    </div>
  );
}
