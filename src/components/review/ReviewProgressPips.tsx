"use client";

interface ReviewProgressPipsProps {
  total: number;
  current: number; // 0-based index of active item
  completed: number[];
}

export default function ReviewProgressPips({
  total,
  current,
  completed,
}: ReviewProgressPipsProps) {
  // Show max 12 pips; if more, show a count badge
  const maxVisible = 12;
  const visible = Math.min(total, maxVisible);

  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: visible }).map((_, i) => {
        const isDone = completed.includes(i);
        const isActive = i === current;
        return (
          <div
            key={i}
            className="h-2 rounded-full transition-all duration-300"
            style={{
              width: isActive ? 20 : 8,
              background: isDone
                ? "var(--sage)"
                : isActive
                ? "var(--ink)"
                : "var(--paper-3)",
            }}
          />
        );
      })}
      {total > maxVisible && (
        <span
          className="text-[11px] font-heading ms-1"
          style={{ color: "var(--ink)", opacity: 0.5 }}
        >
          +{total - maxVisible}
        </span>
      )}
    </div>
  );
}
