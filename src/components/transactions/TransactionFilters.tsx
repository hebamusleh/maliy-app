"use client";

import type { Project } from "@/types/project";

interface TransactionFiltersProps {
  projects: Project[];
  activeFilter: string; // project_id | 'all' | 'income' | 'pending'
  onFilterChange: (filter: string) => void;
  counts: Record<string, number>;
}

const STATIC_FILTERS = [
  { id: "all", label: "الكل" },
  { id: "pending", label: "معلّقة" },
];

export default function TransactionFilters({
  projects,
  activeFilter,
  onFilterChange,
  counts,
}: TransactionFiltersProps) {
  const allFilters = [
    ...STATIC_FILTERS,
    ...projects.map((p) => ({ id: p.id, label: `${p.icon} ${p.name}` })),
  ];

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {allFilters.map((f) => {
        const isActive = activeFilter === f.id;
        const count = counts[f.id];
        return (
          <button
            key={f.id}
            onClick={() => onFilterChange(f.id)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-[12.5px] font-heading font-semibold whitespace-nowrap flex-shrink-0 transition-all active:scale-95"
            style={{
              background: isActive ? "var(--ink)" : "var(--paper-3)",
              color: isActive ? "var(--amber-2)" : "var(--ink)",
            }}
          >
            {f.label}
            {count !== undefined && count > 0 && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full font-heading"
                style={{
                  background: isActive
                    ? "rgba(255,255,255,0.15)"
                    : "var(--paper-2)",
                  color: isActive ? "var(--amber-soft)" : "var(--ink)",
                }}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
