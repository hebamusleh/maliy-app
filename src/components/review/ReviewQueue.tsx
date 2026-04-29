"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { Transaction } from "@/types/project";
import type { Project } from "@/types/project";
import ReviewCard from "./ReviewCard";

async function fetchPendingTransactions(): Promise<Transaction[]> {
  const res = await fetch("/api/transactions?status=pending&limit=50");
  if (!res.ok) throw new Error("Failed to fetch pending transactions");
  const json = await res.json();
  return json.transactions ?? [];
}

async function fetchProjects(): Promise<Project[]> {
  const res = await fetch("/api/projects");
  if (!res.ok) throw new Error("Failed to fetch projects");
  const json = await res.json();
  return json.projects ?? [];
}

async function classifyTransaction(
  id: string,
  projectId: string,
  applyToMerchant: boolean
): Promise<{ applied_count: number; rule_created: boolean }> {
  const res = await fetch(`/api/transactions/${id}/classify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ project_id: projectId, apply_to_merchant: applyToMerchant }),
  });
  if (!res.ok) throw new Error("Classification failed");
  return res.json();
}

export default function ReviewQueue() {
  const queryClient = useQueryClient();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedIndices, setCompletedIndices] = useState<number[]>([]);
  const [skippedIds, setSkippedIds] = useState<Set<string>>(new Set());

  const { data: transactions = [], isLoading: txLoading } = useQuery<Transaction[]>({
    queryKey: ["transactions", "pending"],
    queryFn: fetchPendingTransactions,
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["projects"],
    queryFn: fetchProjects,
  });

  const classify = useMutation({
    mutationFn: ({
      id,
      projectId,
      applyToMerchant,
    }: {
      id: string;
      projectId: string;
      applyToMerchant: boolean;
    }) => classifyTransaction(id, projectId, applyToMerchant),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  // Filter out skipped-this-session transactions from display order
  const queue = transactions.filter((tx) => !skippedIds.has(tx.id));
  const current = queue[currentIndex];

  const handleClassify = async (projectId: string, applyToMerchant: boolean) => {
    if (!current) return;
    await classify.mutateAsync({ id: current.id, projectId, applyToMerchant });
    setCompletedIndices((prev) => [...prev, currentIndex]);
    // Advance to next
    setCurrentIndex((i) => i + 1);
  };

  const handleSkip = () => {
    if (!current) return;
    setSkippedIds((s) => new Set(s).add(current.id));
    setCurrentIndex((i) => i + 1);
  };

  if (txLoading) {
    return (
      <div
        className="rounded-3xl animate-pulse"
        style={{ height: 380, background: "var(--paper-3)" }}
      />
    );
  }

  if (!queue.length || currentIndex >= queue.length) {
    return (
      <div
        className="rounded-3xl flex flex-col items-center justify-center gap-3 py-14"
        style={{ background: "var(--paper-2)", border: "1px solid var(--line)" }}
      >
        <span className="text-[40px]">✅</span>
        <p className="font-heading text-[17px] font-semibold" style={{ color: "var(--sage)" }}>
          انتهيت! كل المعاملات صُنِّفت
        </p>
        <p className="text-[13px] opacity-60 text-center px-8">
          أحسنت — يمكنك الآن مراجعة التقارير أو إضافة معاملات جديدة.
        </p>
      </div>
    );
  }

  // Derive suggested project from AI confidence
  const suggestedProjectId =
    current.confidence_score && current.confidence_score >= 0.5
      ? (current.project_id ?? null)
      : null;

  return (
    <ReviewCard
      transaction={current}
      projects={projects}
      suggestedProjectId={suggestedProjectId}
      onClassify={handleClassify}
      onSkip={handleSkip}
      totalCount={queue.length}
      currentIndex={currentIndex}
      completedIndices={completedIndices}
    />
  );
}
