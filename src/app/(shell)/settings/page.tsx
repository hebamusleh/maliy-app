"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function SettingsPage() {
  const [name, setName] = useState("سارة المنصور");
  const [email, setEmail] = useState("sara@example.com");
  const [phone, setPhone] = useState("+966 50 000 0000");
  const [confidenceThreshold, setConfidenceThreshold] = useState(0.9);
  const [silentAutoClassify, setSilentAutoClassify] = useState(false);

  function handleSave() {
    toast.success("تم حفظ الإعدادات");
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <h1 className="font-heading text-[26px] font-bold" style={{ color: "var(--ink)" }}>
        الإعدادات
      </h1>

      {/* Profile card */}
      <div
        className="rounded-3xl p-6"
        style={{
          background: "var(--paper-2)",
          border: "1px solid var(--line)",
          boxShadow: "var(--shadow)",
        }}
      >
        <h2 className="font-heading text-[17px] font-bold mb-5" style={{ color: "var(--ink)" }}>
          الملف الشخصي
        </h2>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center font-heading font-bold text-[22px]"
            style={{
              background: "linear-gradient(135deg, #E0A050, #B85C5C)",
              color: "var(--ink)",
            }}
          >
            {name.charAt(0)}
          </div>
          <div>
            <p className="font-heading font-semibold text-[15px]" style={{ color: "var(--ink)" }}>
              {name}
            </p>
            <p className="text-[12px] opacity-55" style={{ color: "var(--ink)" }}>
              الباقة الذهبية
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[12px] font-heading font-semibold mb-1.5 opacity-60" style={{ color: "var(--ink)" }}>
              الاسم
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl px-4 py-3 font-body text-[14px] outline-none"
              style={{
                background: "var(--paper)",
                border: "1px solid var(--line-strong)",
                color: "var(--ink)",
              }}
            />
          </div>

          <div>
            <label className="block text-[12px] font-heading font-semibold mb-1.5 opacity-60" style={{ color: "var(--ink)" }}>
              البريد الإلكتروني
            </label>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              dir="ltr"
              className="w-full rounded-xl px-4 py-3 font-body text-[14px] outline-none"
              style={{
                background: "var(--paper)",
                border: "1px solid var(--line-strong)",
                color: "var(--ink)",
                textAlign: "end",
              }}
            />
          </div>

          <div>
            <label className="block text-[12px] font-heading font-semibold mb-1.5 opacity-60" style={{ color: "var(--ink)" }}>
              رقم الهاتف
            </label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              dir="ltr"
              className="w-full rounded-xl px-4 py-3 font-body text-[14px] outline-none"
              style={{
                background: "var(--paper)",
                border: "1px solid var(--line-strong)",
                color: "var(--ink)",
                textAlign: "end",
              }}
            />
          </div>
        </div>
      </div>

      {/* Classification settings */}
      <div
        className="rounded-3xl p-6"
        style={{
          background: "var(--paper-2)",
          border: "1px solid var(--line)",
          boxShadow: "var(--shadow)",
        }}
      >
        <h2 className="font-heading text-[17px] font-bold mb-5" style={{ color: "var(--ink)" }}>
          إعدادات التصنيف
        </h2>

        <div className="flex flex-col gap-5">
          {/* Confidence threshold */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="font-heading text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
                حد الثقة للتصنيف التلقائي
              </label>
              <span
                className="font-numbers text-[15px] font-medium"
                style={{ color: "var(--amber)" }}
              >
                {Math.round(confidenceThreshold * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.5}
              max={1}
              step={0.05}
              value={confidenceThreshold}
              onChange={(e) => setConfidenceThreshold(Number(e.target.value))}
              className="w-full"
              style={{ accentColor: "var(--amber)" }}
            />
            <p className="text-[11.5px] opacity-50 mt-1.5" style={{ color: "var(--ink)" }}>
              المعاملات التي تتجاوز هذا الحد تُصنَّف تلقائياً دون مراجعة
            </p>
          </div>

          {/* Silent auto-classify toggle */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-heading text-[14px] font-semibold" style={{ color: "var(--ink)" }}>
                التصنيف الصامت
              </p>
              <p className="text-[11.5px] opacity-50 mt-0.5" style={{ color: "var(--ink)" }}>
                صنّف تلقائياً بدون إشعارات
              </p>
            </div>
            <button
              onClick={() => setSilentAutoClassify(!silentAutoClassify)}
              className="w-12 h-6 rounded-full transition-all relative"
              style={{
                background: silentAutoClassify ? "var(--sage)" : "var(--paper-3)",
                border: "1px solid var(--line-strong)",
              }}
              aria-checked={silentAutoClassify}
              role="switch"
            >
              <span
                className="absolute top-0.5 w-5 h-5 rounded-full transition-all"
                style={{
                  background: "var(--paper)",
                  boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                  insetInlineStart: silentAutoClassify ? "calc(100% - 22px)" : "2px",
                }}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Subscription info */}
      <div
        className="rounded-3xl p-6"
        style={{
          background: "linear-gradient(135deg, var(--ink), var(--ink-2))",
          color: "var(--paper)",
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-[17px] font-bold mb-1">الاشتراك</h2>
            <p className="text-[13px] opacity-60">الباقة الذهبية · تنتهي في 2026/12/31</p>
          </div>
          <div
            className="px-4 py-2 rounded-xl font-heading text-[13px] font-semibold"
            style={{ background: "var(--amber)", color: "var(--ink)" }}
          >
            ذهبية
          </div>
        </div>
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        className="w-full py-3.5 rounded-2xl font-heading text-[15px] font-bold transition-all active:scale-[0.98]"
        style={{ background: "var(--ink)", color: "var(--amber-2)" }}
      >
        حفظ الإعدادات
      </button>
    </div>
  );
}
