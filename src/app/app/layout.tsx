import { ReactNode } from "react";
import { AppHeader } from "@/components/nav/AppHeader";

export default function AppAreaLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(120deg,#040916_0%,#07112b_55%,#0d1a3c_100%)] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute -top-40 left-1/2 h-[620px] w-[620px] -translate-x-1/2 bg-[radial-gradient(circle,rgba(95,139,255,0.26),transparent_72%)] blur-[140px]" />
        <div className="absolute bottom-[-32%] right-[-12%] h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle,rgba(122,93,255,0.22),transparent_70%)] blur-[125px]" />
      </div>
      <AppHeader />
      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-10">
        {children}
      </main>
    </div>
  );
}
