"use client";

import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import ChatPanel from "@/components/layout/ChatPanel";
import { Toaster } from "react-hot-toast";
import type { ReactNode } from "react";

export default function ShellLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--paper)" }}
    >
      {/* 3-column grid: sidebar | main | chat */}
      <div
        className="grid max-w-[1480px] mx-auto gap-6 p-6 min-h-screen"
        style={{
          gridTemplateColumns: "280px 1fr 400px",
          backgroundImage:
            "radial-gradient(1200px 600px at 90% -10%, rgba(200,133,58,0.08), transparent 60%), radial-gradient(900px 500px at 0% 110%, rgba(14,27,44,0.06), transparent 60%)",
        }}
      >
        {/* Sidebar — right in RTL */}
        <Sidebar />

        {/* Main content */}
        <main
          id="main-content"
          className="flex flex-col gap-5 min-w-0"
          tabIndex={-1}
        >
          <TopBar />
          {children}
        </main>

        {/* Chat panel — left in RTL */}
        <ChatPanel />
      </div>

      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            fontFamily: "var(--font-body)",
            direction: "rtl",
            background: "var(--ink)",
            color: "var(--paper)",
          },
        }}
      />
    </div>
  );
}
