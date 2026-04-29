import { ReactNode } from "react";

// Root layout wrapper — minimal; shell layout lives in src/app/(shell)/layout.tsx
export default function Layout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
