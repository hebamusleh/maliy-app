import { ErrorBoundary } from "@/components/error/ErrorBoundary";
import Layout from "@/components/layout/Layout";
import QueryClientProviderWrapper from "@/components/providers/QueryClientProvider";
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ماليّ - Financial Management",
  description: "Manage your finances with AI-powered insights",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:start-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-amber focus:text-white focus:rounded-md"
        >
          تخطي إلى المحتوى الرئيسي
        </a>
        <QueryClientProviderWrapper>
          <ErrorBoundary>
            <Layout>{children}</Layout>
          </ErrorBoundary>
        </QueryClientProviderWrapper>
      </body>
    </html>
  );
}
