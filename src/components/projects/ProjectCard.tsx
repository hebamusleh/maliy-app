"use client";

import { Project } from "@/types/project";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface ProjectCardProps {
  project: Project & { spend?: number; budget_used_pct?: number | null };
  onEdit: (p: Project) => void;
  onDelete: (id: string) => void;
}

const PROJECT_TYPE_LABELS: Record<string, string> = {
  personal: "شخصي",
  business: "تجاري",
  freelance: "فريلانس",
};

export default function ProjectCard({ project, onEdit, onDelete }: ProjectCardProps) {
  const router = useRouter();
  const [confirmDelete, setConfirmDelete] = useState(false);

  const usedPct = project.budget_used_pct ?? 0;
  const overBudget = usedPct >= 85;

  const handleCardClick = () => {
    router.push(`/projects/${project.id}`);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(project);
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDelete(true);
  };

  const handleDeleteConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(project.id);
    setConfirmDelete(false);
  };

  const handleDeleteCancel = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDelete(false);
  };

  return (
    <div
      onClick={handleCardClick}
      className="rounded-2xl p-4 flex flex-col gap-3 cursor-pointer transition-shadow hover:shadow-md"
      style={{ background: "var(--paper-2)", border: "1px solid var(--line)" }}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-2xl flex-shrink-0">{project.icon}</span>
          <div className="min-w-0">
            <p className="font-heading font-semibold truncate text-[15px]" style={{ color: "var(--ink)" }}>
              {project.name}
            </p>
            <span
              className="inline-block text-[11px] px-2 py-0.5 rounded-full mt-0.5"
              style={{ background: "var(--paper-3)", color: "var(--ink)", opacity: 0.7 }}
            >
              {PROJECT_TYPE_LABELS[project.type] ?? project.type}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-1 flex-shrink-0">
          <button
            onClick={handleEdit}
            aria-label={`تعديل ${project.name}`}
            className="p-1.5 rounded-lg transition-colors hover:opacity-70"
            style={{ color: "var(--ink)", opacity: 0.45 }}
          >
            <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" width="15" height="15">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            onClick={handleDeleteClick}
            aria-label={`حذف ${project.name}`}
            className="p-1.5 rounded-lg transition-colors hover:opacity-70"
            style={{ color: "var(--rose)", opacity: 0.55 }}
          >
            <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" width="15" height="15">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
            </svg>
          </button>
        </div>
      </div>

      {/* Budget bar */}
      {project.budget_limit != null && (
        <div className="flex flex-col gap-1">
          <div className="flex justify-between text-[11px]" style={{ color: "var(--ink)", opacity: 0.55 }}>
            <span>
              <span className="font-numbers">{(project.spend ?? 0).toFixed(0)}</span>
              {" / "}
              <span className="font-numbers">{project.budget_limit}</span>
              {" ريال"}
            </span>
            <span className="font-numbers">{usedPct.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ background: "var(--line)" }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(usedPct, 100)}%`,
                background: overBudget ? "var(--rose)" : "var(--sage)",
              }}
            />
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div
          className="rounded-xl p-3 flex flex-col gap-2"
          style={{ background: "var(--paper-3)", border: "1px solid var(--line)" }}
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-[13px] font-medium" style={{ color: "var(--ink)" }}>
            هل تريد حذف هذا المشروع؟
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleDeleteConfirm}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium"
              style={{ background: "var(--rose)", color: "var(--paper)" }}
            >
              حذف
            </button>
            <button
              onClick={handleDeleteCancel}
              className="px-3 py-1.5 rounded-lg text-[12px]"
              style={{ background: "var(--line)", color: "var(--ink)" }}
            >
              إلغاء
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
