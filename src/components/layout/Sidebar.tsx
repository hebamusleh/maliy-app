"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

const navItems = [
  {
    label: "القائمة الرئيسية",
    type: "section" as const,
  },
  {
    page: "/",
    label: "لوحة التحكم",
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" width="18" height="18">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l9-9 9 9M5 10v10h14V10" />
      </svg>
    ),
  },
  {
    page: "/transactions",
    label: "المعاملات",
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" width="18" height="18">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM3 10h18" />
      </svg>
    ),
  },
  {
    page: "/review",
    label: "تنتظر تصنيفك",
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" width="18" height="18">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </svg>
    ),
    badgeKey: "pending" as const,
  },
  {
    page: "/analytics",
    label: "التحليلات",
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" width="18" height="18">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 14l4-4 4 4 5-5" />
      </svg>
    ),
  },
  {
    page: "/forecast",
    label: "التنبؤات",
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" width="18" height="18">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v4m0 12v4m10-10h-4M6 12H2m15.07-7.07l-2.83 2.83M9.76 14.24l-2.83 2.83m0-12.14l2.83 2.83m4.48 4.48l2.83 2.83" />
      </svg>
    ),
  },
  {
    page: "/debts",
    label: "الديون",
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" width="18" height="18">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 0 0-8 0v4M5 11h14l-1 10H6z" />
      </svg>
    ),
  },
  {
    page: "/alerts",
    label: "التنبيهات",
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" width="18" height="18">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A7 7 0 0 1 17 11V8A5 5 0 0 0 7 8v3a7 7 0 0 1-1.6 4.6L4 17h5m6 0a3 3 0 0 1-6 0" />
      </svg>
    ),
  },
  { label: "المشاريع", type: "section" as const },
  {
    page: "/projects/personal",
    label: "شخصي",
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" width="18" height="18">
        <circle cx="12" cy="8" r="4" /><path strokeLinecap="round" d="M4 21c0-4 4-7 8-7s8 3 8 7" />
      </svg>
    ),
  },
  {
    page: "/projects/work",
    label: "عمل",
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" width="18" height="18">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h18v13H3zM8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      </svg>
    ),
  },
  {
    page: "/projects/freelance",
    label: "فريلانس",
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" width="18" height="18">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 2L2 7l10 5 10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
  },
  { label: "إعدادات", type: "section" as const },
  {
    page: "/settings",
    label: "الإعدادات",
    icon: (
      <svg fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24" width="18" height="18">
        <circle cx="12" cy="12" r="3" />
        <path strokeLinecap="round" d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 0 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 0 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 0 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 0 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
      </svg>
    ),
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  const { data: dashboardData } = useQuery<{ pending_count?: number }>({
    queryKey: ["dashboard-pending"],
    queryFn: async () => {
      const res = await fetch("/api/dashboard");
      if (!res.ok) return {};
      return res.json();
    },
    staleTime: 60_000,
  });

  const pendingCount = dashboardData?.pending_count ?? 0;

  return (
    <aside
      className="rounded-3xl flex flex-col overflow-hidden relative"
      style={{
        background: "var(--ink)",
        color: "var(--paper)",
        padding: "28px 22px",
        position: "sticky",
        top: "24px",
        height: "calc(100vh - 48px)",
      }}
    >
      {/* Ambient gradient */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(400px 200px at 100% 0%, rgba(224,160,80,0.18), transparent 70%), radial-gradient(300px 200px at 0% 100%, rgba(224,160,80,0.08), transparent 70%)",
        }}
      />

      {/* Brand */}
      <div className="flex items-center gap-3 relative z-10">
        <div
          className="flex items-center justify-center rounded-xl font-heading font-bold text-[22px]"
          style={{
            width: 44,
            height: 44,
            background: "linear-gradient(135deg, var(--amber-2), var(--amber))",
            color: "var(--ink)",
            boxShadow: "inset 0 -2px 6px rgba(0,0,0,0.18), 0 6px 18px rgba(200,133,58,0.4)",
          }}
        >
          م
        </div>
        <div>
          <h1 className="font-heading text-[22px] font-semibold tracking-tight" style={{ color: "var(--paper)" }}>
            ماليّ
          </h1>
          <span className="text-[11px] opacity-60 tracking-widest">SMART FINANCE</span>
        </div>
      </div>

      {/* Nav */}
      <nav
        className="mt-7 flex flex-col gap-1 relative z-10 overflow-y-auto flex-1"
        style={{ scrollbarWidth: "thin" }}
        aria-label="التنقل الرئيسي"
      >
        {navItems.map((item, i) => {
          if (item.type === "section") {
            return (
              <div
                key={i}
                className="text-[10px] tracking-widest opacity-45 px-3 mt-4 mb-2"
              >
                {item.label}
              </div>
            );
          }

          const isActive = item.page === "/" ? pathname === "/" : pathname.startsWith(item.page!);
          const badge = item.badgeKey === "pending" && pendingCount > 0 ? pendingCount : null;

          return (
            <Link
              key={item.page}
              href={item.page!}
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-heading font-medium text-[14.5px] transition-all"
              style={{
                color: isActive ? "var(--paper)" : "rgba(244,239,230,0.7)",
                background: isActive ? "rgba(244,239,230,0.08)" : "transparent",
                boxShadow: isActive ? "inset 0 0 0 1px rgba(224,160,80,0.25)" : "none",
              }}
            >
              {isActive && (
                <span
                  className="w-1 rounded-sm"
                  style={{
                    height: 18,
                    background: "var(--amber-2)",
                    marginInlineStart: -4,
                    flexShrink: 0,
                  }}
                />
              )}
              <span className="opacity-85">{item.icon}</span>
              {item.label}
              {badge !== null && (
                <span
                  className="ms-auto rounded-lg text-[10px] font-bold px-1.5 py-0.5 animate-pulse"
                  style={{ background: "var(--rose)", color: "var(--paper)" }}
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Learning card */}
      <div
        className="mt-4 rounded-2xl p-3.5 relative z-10"
        style={{
          background: "rgba(244,239,230,0.05)",
          border: "1px solid rgba(244,239,230,0.10)",
        }}
      >
        <div className="flex items-center gap-2 mb-2.5">
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: "var(--sage)" }}
          />
          <span className="font-heading text-[11.5px] font-medium">يتعلم منكِ</span>
        </div>
        <div className="font-numbers text-[22px] font-medium">87%</div>
        <div className="text-[11px] opacity-55 mt-0.5">دقة التصنيف التلقائي</div>
        <div
          className="mt-2.5 h-1 rounded-sm overflow-hidden"
          style={{ background: "rgba(244,239,230,0.10)" }}
        >
          <div
            className="h-full rounded-sm"
            style={{
              width: "87%",
              background: "linear-gradient(90deg, var(--sage), var(--amber-2))",
            }}
          />
        </div>
        <div className="text-[10.5px] opacity-55 mt-2">+3% هذا الأسبوع</div>
      </div>

      {/* User footer */}
      <div
        className="mt-3 rounded-2xl p-3.5 relative z-10"
        style={{
          background: "rgba(244,239,230,0.04)",
          border: "1px solid rgba(244,239,230,0.08)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center font-heading font-bold text-sm"
            style={{
              background: "linear-gradient(135deg, #E0A050, #B85C5C)",
              color: "var(--ink)",
            }}
          >
            س
          </div>
          <div className="flex-1">
            <b className="block font-heading text-sm">سارة المنصور</b>
            <small className="opacity-55 text-[11px]">الباقة الذهبية</small>
          </div>
        </div>
      </div>
    </aside>
  );
}
