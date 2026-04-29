"use client";

import type { Project } from "@/types/project";

interface ProjectChoicePickerProps {
  projects: Project[];
  suggestedProjectId: string | null;
  onClassify: (projectId: string, applyToMerchant: boolean) => void;
  applyToMerchant: boolean;
}

const PROJECT_COLORS: Record<string, string> = {
  personal: "var(--amber)",
  business: "var(--ink-3)",
  freelance: "var(--sage)",
};

export default function ProjectChoicePicker({
  projects,
  suggestedProjectId,
  onClassify,
  applyToMerchant,
}: ProjectChoicePickerProps) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {projects.map((project) => {
        const isSuggested = project.id === suggestedProjectId;
        const accentColor = PROJECT_COLORS[project.type] ?? "var(--amber)";
        return (
          <button
            key={project.id}
            onClick={() => onClassify(project.id, applyToMerchant)}
            className="flex flex-col items-center gap-1.5 px-3 py-3.5 rounded-2xl transition-all duration-200 active:scale-95"
            style={{
              background: isSuggested ? accentColor : "var(--paper-3)",
              border: isSuggested
                ? `2px solid ${accentColor}`
                : "2px solid transparent",
              color: isSuggested ? "var(--paper)" : "var(--ink)",
            }}
          >
            <span className="text-[22px] leading-none">{project.icon}</span>
            <span
              className="text-[12px] font-heading font-semibold text-center leading-tight"
              style={{ color: isSuggested ? "var(--paper)" : "var(--ink)" }}
            >
              {project.name}
            </span>
            {isSuggested && (
              <span
                className="text-[10px] font-heading px-1.5 py-0.5 rounded-full"
                style={{
                  background: "rgba(255,255,255,0.25)",
                  color: "var(--paper)",
                }}
              >
                مقترح
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
