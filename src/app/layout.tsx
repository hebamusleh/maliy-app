import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import Layout from "@/components/layout/Layout";
import QueryClientProviderWrapper from "@/components/providers/QueryClientProvider";
import { Fraunces, Noto_Naskh_Arabic, Reem_Kufi } from "next/font/google";
import type { Metadata } from "next";
import "./globals.css";
import ShellLayout from "@/components/layout/Layout";

const reemKufi = Reem_Kufi({
  subsets: ["arabic"],
  variable: "--font-heading",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const notoNaskh = Noto_Naskh_Arabic({
  subsets: ["arabic"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-numbers",
  axes: ["opsz"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "ماليّ - مساعدك المالي الذكي",
  description: "إدارة مالية ذكية بالذكاء الاصطناعي",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ar"
      dir="rtl"
      className={`h-full antialiased ${reemKufi.variable} ${notoNaskh.variable} ${fraunces.variable}`}
    >
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:start-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--amber)] focus:text-white focus:rounded-md"
        >
          تخطي إلى المحتوى الرئيسي
        </a>
        <QueryClientProviderWrapper>
          <ErrorBoundary>
            <ShellLayout>{children}</ShellLayout>
          </ErrorBoundary>
        </QueryClientProviderWrapper>
      </body>
    </html>
  );
}
