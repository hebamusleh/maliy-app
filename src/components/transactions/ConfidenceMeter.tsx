"use client";

interface ConfidenceMeterProps {
  score: number; // 0–1
  size?: "sm" | "md";
}

export default function ConfidenceMeter({ score, size = "md" }: ConfidenceMeterProps) {
  const pipCount = 5;
  const filled = Math.round(score * pipCount);

  const color =
    score >= 0.8 ? "var(--sage)" : score >= 0.5 ? "var(--amber)" : "var(--rose)";

  const pipSize = size === "sm" ? "w-1.5 h-3" : "w-2 h-4";

  return (
    <div className="flex items-end gap-0.5" title={`${Math.round(score * 100)}% ثقة`}>
      {Array.from({ length: pipCount }).map((_, i) => (
        <div
          key={i}
          className={`${pipSize} rounded-sm transition-colors`}
          style={{
            background: i < filled ? color : "var(--paper-3)",
          }}
        />
      ))}
    </div>
  );
}
