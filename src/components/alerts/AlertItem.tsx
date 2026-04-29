"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Alert } from "@/types/index";

interface AlertItemProps {
  alert: Alert;
}

const ALERT_STYLE: Record<string, { border: string; iconBg: string; iconColor: string }> = {
  urgent: {
    border: "var(--rose)",
    iconBg: "rgba(184,92,92,0.15)",
    iconColor: "var(--rose)",
  },
  recommendation: {
    border: "var(--amber)",
    iconBg: "rgba(200,133,58,0.15)",
    iconColor: "var(--amber)",
  },
  reminder: {
    border: "var(--amber)",
    iconBg: "rgba(200,133,58,0.15)",
    iconColor: "var(--amber)",
  },
  achievement: {
    border: "var(--sage)",
    iconBg: "rgba(107,142,107,0.18)",
    iconColor: "var(--sage)",
  },
};

const ICONS: Record<string, string> = {
  urgent: "⚠",
  recommendation: "💡",
  reminder: "📅",
  achievement: "🏆",
};

async function dismissAlert(id: string) {
  const res = await fetch(`/api/alerts/${id}/dismiss`, { method: "POST" });
  if (!res.ok) throw new Error("Dismiss failed");
  return res.json();
}

export default function AlertItem({ alert }: AlertItemProps) {
  const queryClient = useQueryClient();
  const s = ALERT_STYLE[alert.type] ?? ALERT_STYLE.achievement;

  const dismiss = useMutation({
    mutationFn: () => dismissAlert(alert.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    },
  });

  return (
    <div
      className="flex gap-3.5 items-start px-4 py-4 rounded-2xl relative overflow-hidden"
      style={{
        background: "var(--paper-2)",
        border: "1px solid var(--line)",
        opacity: alert.dismissed ? 0.5 : 1,
      }}
    >
      {/* Accent bar */}
      <div
        className="absolute inset-y-0 end-0 w-1 rounded-sm"
        style={{ background: s.border }}
      />

      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-[17px]"
        style={{ background: s.iconBg, color: s.iconColor }}
      >
        {ICONS[alert.type] ?? "ℹ"}
      </div>

      <div className="flex-1 min-w-0">
        <b className="block font-heading text-[14.5px] mb-1" style={{ color: "var(--ink)" }}>
          {alert.title}
        </b>
        <p className="text-[13px] opacity-75 leading-relaxed" style={{ color: "var(--ink)" }}>
          {alert.body}
        </p>
        <span className="block text-[11px] opacity-50 mt-1.5 font-heading" style={{ color: "var(--ink)" }}>
          {new Date(alert.created_at).toLocaleDateString("ar-SA")}
        </span>
      </div>

      {!alert.dismissed && alert.action_type !== "dismiss-only" && (
        <button
          onClick={() => dismiss.mutate()}
          disabled={dismiss.isPending}
          className="flex-shrink-0 text-[11px] font-heading px-2.5 py-1.5 rounded-xl transition-opacity hover:opacity-70"
          style={{ background: "var(--paper-3)", color: "var(--ink)", opacity: 0.7 }}
        >
          رفض
        </button>
      )}
    </div>
  );
}
