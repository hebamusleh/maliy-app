"use client";

import type { AlertCounts, AlertType } from "@/types/index";

type Tab = "all" | AlertType;

interface AlertTabsProps {
  active: Tab;
  onChange: (tab: Tab) => void;
  counts: AlertCounts;
}

const TABS: Array<{ id: Tab; label: string; emoji: string }> = [
  { id: "all", label: "الكل", emoji: "📋" },
  { id: "urgent", label: "عاجل", emoji: "⚠" },
  { id: "recommendation", label: "توصية", emoji: "💡" },
  { id: "reminder", label: "تذكير", emoji: "📅" },
  { id: "achievement", label: "إنجاز", emoji: "🏆" },
];

export default function AlertTabs({ active, onChange, counts }: AlertTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {TABS.map((t) => {
        const count = counts[t.id as keyof AlertCounts];
        const isActive = active === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-[12.5px] font-heading font-semibold whitespace-nowrap flex-shrink-0 transition-all active:scale-95"
            style={{
              background: isActive ? "var(--ink)" : "var(--paper-3)",
              color: isActive ? "var(--amber-2)" : "var(--ink)",
            }}
          >
            <span>{t.emoji}</span>
            {t.label}
            {count > 0 && (
              <span
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{
                  background: isActive ? "rgba(255,255,255,0.15)" : "var(--paper-2)",
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
