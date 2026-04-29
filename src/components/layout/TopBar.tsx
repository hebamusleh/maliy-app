"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "صباح الخير", emoji: "☀️" };
  if (hour < 17) return { text: "مساء الخير", emoji: "🌤️" };
  return { text: "مساء الخير", emoji: "🌙" };
}

export default function TopBar() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [greeting, setGreeting] = useState(getGreeting());

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) {
      router.push(`/transactions?search=${encodeURIComponent(search.trim())}`);
    }
  }

  return (
    <div
      className="flex items-center gap-4 rounded-2xl px-4 py-3"
      style={{
        background: "var(--paper-2)",
        border: "1px solid var(--line)",
      }}
    >
      <p className="font-heading text-[18px] font-medium">
        {greeting.text}{" "}
        {greeting.emoji}{" "}
        <b style={{ color: "var(--amber)" }}>سارة</b>
      </p>

      <form
        onSubmit={handleSearch}
        className="ms-auto flex items-center gap-2 rounded-xl px-3.5 py-2"
        style={{
          background: "var(--paper)",
          border: "1px solid var(--line)",
          width: 280,
        }}
      >
        <svg
          width="16"
          height="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
          style={{ opacity: 0.5, flexShrink: 0 }}
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث في معاملاتك..."
          className="flex-1 border-0 bg-transparent outline-none font-body text-sm"
          style={{ color: "var(--ink)" }}
          aria-label="البحث في المعاملات"
        />
      </form>

      {/* Notifications */}
      <Link
        href="/alerts"
        className="w-9 h-9 rounded-xl flex items-center justify-center relative"
        style={{
          background: "var(--paper)",
          border: "1px solid var(--line)",
          color: "var(--ink)",
        }}
        title="التنبيهات"
        aria-label="التنبيهات"
      >
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M15 17h5l-1.4-1.4A7 7 0 0 1 17 11V8A5 5 0 0 0 7 8v3a7 7 0 0 1-1.6 4.6L4 17h5m6 0a3 3 0 0 1-6 0" />
        </svg>
        <span
          className="absolute top-2 end-2 w-2 h-2 rounded-full"
          style={{ background: "var(--rose)", border: "2px solid var(--paper)" }}
        />
      </Link>

      {/* Settings */}
      <Link
        href="/settings"
        className="w-9 h-9 rounded-xl flex items-center justify-center"
        style={{
          background: "var(--paper)",
          border: "1px solid var(--line)",
          color: "var(--ink)",
        }}
        title="الإعدادات"
        aria-label="الإعدادات"
      >
        <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
        </svg>
      </Link>
    </div>
  );
}
