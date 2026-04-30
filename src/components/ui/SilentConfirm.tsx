"use client";

import { useEffect, useState } from "react";

interface SilentConfirmProps {
  message: string;
  onUndo: () => void;
  durationMs?: number;
}

export default function SilentConfirm({
  message,
  onUndo,
  durationMs = 5000,
}: SilentConfirmProps) {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / durationMs) * 100);
      setProgress(remaining);
      if (remaining === 0) {
        clearInterval(interval);
        setVisible(false);
      }
    }, 50);

    return () => clearInterval(interval);
  }, [durationMs]);

  if (!visible) return null;

  return (
    <div
      className="rounded-2xl px-4 py-3 flex items-center gap-3 relative overflow-hidden"
      style={{
        background: "var(--paper-2)",
        border: "1px solid var(--line-strong)",
        boxShadow: "var(--shadow)",
      }}
      role="status"
      aria-live="polite"
    >
      {/* Progress bar */}
      <div
        className="absolute bottom-0 start-0 h-0.5 transition-all"
        style={{
          width: `${progress}%`,
          background: "var(--amber)",
        }}
      />

      <span className="text-[13px] flex-1 font-heading opacity-75" style={{ color: "var(--ink)" }}>
        {message}
      </span>

      <button
        onClick={() => {
          setVisible(false);
          onUndo();
        }}
        className="px-3 py-1.5 rounded-xl text-[12px] font-heading font-semibold transition-all active:scale-95"
        style={{
          background: "var(--ink)",
          color: "var(--paper)",
          border: "none",
        }}
      >
        تراجع
      </button>
    </div>
  );
}
