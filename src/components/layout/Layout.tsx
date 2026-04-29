import { ReactNode } from "react";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-gray-200 p-4">
        <div className="container mx-auto">
          <h1 className="text-2xl font-heading font-bold text-amber">ماليّ</h1>
          <nav className="mt-2">
            <a
              href="/projects"
              className="mr-4 text-foreground hover:text-amber"
            >
              المشاريع
            </a>
            <a
              href="/dashboard"
              className="mr-4 text-foreground hover:text-amber"
            >
              لوحة التحكم
            </a>
          </nav>
        </div>
      </header>
      <main className="container mx-auto p-4">{children}</main>
    </div>
  );
}
