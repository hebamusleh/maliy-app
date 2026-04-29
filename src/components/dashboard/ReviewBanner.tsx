"use client";

interface ReviewBannerProps {
  pendingCount: number;
  onStart: () => void;
}

export default function ReviewBanner({ pendingCount, onStart }: ReviewBannerProps) {
  if (pendingCount === 0) return null;

  return (
    <div
      className="rounded-2xl p-4 flex items-center gap-4 relative overflow-hidden cursor-pointer"
      style={{
        background: "linear-gradient(135deg, var(--ink) 0%, var(--ink-2) 100%)",
        color: "var(--paper)",
        boxShadow: "var(--shadow)",
      }}
      onClick={onStart}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && onStart()}
    >
      <div
        className="absolute pointer-events-none"
        style={{
          insetInlineEnd: -50,
          top: -30,
          width: 200,
          height: 200,
          background: "radial-gradient(circle, rgba(224,160,80,0.18), transparent 60%)",
        }}
      />

      {/* Icon pile */}
      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center font-numbers text-2xl relative flex-shrink-0"
        style={{
          background: "rgba(224,160,80,0.18)",
          color: "var(--amber-2)",
        }}
      >
        {pendingCount}
        <span
          className="absolute inset-[-2px] rounded-2xl"
          style={{
            border: "2px solid rgba(224,160,80,0.35)",
            transform: "translate(3px, -3px)",
          }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 relative z-10">
        <b className="block font-heading text-[15.5px] font-semibold mb-0.5">
          {pendingCount} معاملات تنتظر تصنيفك السريع
        </b>
        <p className="text-[12.5px] opacity-70">
          صنّفنا معظم معاملاتك تلقائيًا اليوم — هذي اللي ما قدرنا نحسمها. تصنيفها يستغرق 30 ثانية فقط.
        </p>
      </div>

      {/* CTA */}
      <button
        className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-heading font-semibold text-[13px] flex-shrink-0 relative z-10"
        style={{
          background: "var(--amber)",
          color: "var(--ink)",
          border: 0,
        }}
        onClick={(e) => { e.stopPropagation(); onStart(); }}
      >
        ابدأ المراجعة
        <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    </div>
  );
}
