import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-gray-200 p-4" role="banner">
        <div className="container mx-auto">
          <h1 className="text-2xl font-heading font-bold text-amber">ماليّ</h1>
          <nav className="mt-2" aria-label="التنقل الرئيسي">
            <a
              href="/projects"
              className="me-4 text-foreground hover:text-amber focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
            >
              المشاريع
            </a>
            <a
              href="/dashboard"
              className="me-4 text-foreground hover:text-amber focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber"
            >
              لوحة التحكم
            </a>
          </nav>
        </div>
      </header>
      <main id="main-content" className="container mx-auto p-4">
        {children}
      </main>
    </div>
  );
}
