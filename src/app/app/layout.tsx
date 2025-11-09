import { ReactNode } from "react";
import { AppHeader } from "@/components/nav/AppHeader";

export default function AppAreaLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0f1c] text-white">
      <AppHeader />
      <main className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </div>
  );
}
