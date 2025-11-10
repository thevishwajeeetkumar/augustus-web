"use client";

import Link from "next/link";
import { AppHeader } from "@/components/nav/AppHeader";
import { Container } from "@/components/layout/Container";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { Card, CardContent } from "@/components/ui/card";
import { BrandWordmark } from "@/components/common/BrandWordmark";

export default function SignUpPage() {
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
                Start your trial
              </span>
              <h1 className="flex flex-nowrap items-center justify-center gap-2 text-3xl font-semibold">
                <span className="whitespace-nowrap">Create your</span>
                <BrandWordmark className="whitespace-nowrap text-3xl sm:text-4xl" />
                <span className="whitespace-nowrap">account</span>
              </h1>
              <p className="text-sm text-white/70">
                Spin up your workspace, ingest your first video, and invite teammates when you’re ready.
              </p>
            </div>
            <Card className="border-white/12 bg-white/8 backdrop-blur">
              <CardContent className="space-y-6 p-7 text-left">
                <SignUpForm onSuccessRedirect="/auth/sign-in" />
                <p className="text-sm text-white/70">
                  Already have an account?{" "}
                  <Link
                    href="/auth/sign-in"
                    className="font-medium text-white underline decoration-white/60 underline-offset-4 hover:decoration-white"
                  >
                    Sign in instead
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
