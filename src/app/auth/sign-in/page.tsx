"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { AppHeader } from "@/components/nav/AppHeader";
import { Container } from "@/components/layout/Container";
import { SignInForm } from "@/components/auth/SignInForm";
import { Card, CardContent } from "@/components/ui/card";
import { BrandWordmark } from "@/components/common/BrandWordmark";

function SignInPageContent() {
  const params = useSearchParams();
  const next = params.get("next") || "/app";

  return (
    <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(120deg,#040916_0%,#07112b_55%,#0d1a3c_100%)] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute -top-32 left-1/2 h-60 w-[640px] -translate-x-1/2 bg-[radial-gradient(circle,rgba(95,139,255,0.32),transparent_70%)] blur-[120px]" />
        <div className="absolute bottom-[-25%] right-[-10%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(122,93,255,0.22),transparent_70%)] blur-[110px]" />
      </div>
      <div className="relative z-20">
        <AppHeader />
        <Container className="py-20">
          <div className="mx-auto max-w-md space-y-6 text-center">
            <div className="space-y-3">
              <span className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-white/55">
                Welcome back
              </span>
              <h1 className="flex flex-nowrap items-center justify-center gap-2 text-3xl font-semibold">
                <span className="whitespace-nowrap">Sign in to</span>
                <BrandWordmark className="whitespace-nowrap text-3xl sm:text-4xl" />
              </h1>
              <p className="text-sm text-white/70">
                Pick up where you left off across videos, sessions, and follow-up workflows.
              </p>
            </div>
            <Card className="border-white/12 bg-white/8 backdrop-blur">
              <CardContent className="space-y-6 p-7 text-left">
                <SignInForm next={next} />
                <p className="text-sm text-white/70">
                  Don’t have an account?{" "}
                  <Link
                    href="/auth/sign-up"
                    className="font-medium text-white underline decoration-white/60 underline-offset-4 hover:decoration-white"
                  >
                    Create one instead
                  </Link>
                  .
                </p>
              </CardContent>
            </Card>
          </div>
        </Container>
      </div>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <main className="relative min-h-screen overflow-hidden bg-[linear-gradient(120deg,#040916_0%,#07112b_55%,#0d1a3c_100%)] text-white">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-white/20 to-transparent" />
            <div className="absolute -top-32 left-1/2 h-60 w-[640px] -translate-x-1/2 bg-[radial-gradient(circle,rgba(95,139,255,0.32),transparent_70%)] blur-[120px]" />
            <div className="absolute bottom-[-25%] right-[-10%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(122,93,255,0.22),transparent_70%)] blur-[110px]" />
          </div>
          <div className="relative z-20">
            <AppHeader />
            <Container className="py-20">
              <div className="mx-auto max-w-md space-y-3 text-center">
                <span className="inline-flex items-center justify-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-white/55">
                  Welcome back
                </span>
                <h1 className="flex items-center justify-center gap-2 text-3xl font-semibold">
                  Sign in to
                  <BrandWordmark className="text-3xl sm:text-4xl" />
                </h1>
              </div>
            </Container>
          </div>
        </main>
      }
    >
      <SignInPageContent />
    </Suspense>
  );
}
