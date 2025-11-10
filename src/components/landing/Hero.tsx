"use client";

import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/app/hooks/useAuth";

export function Hero() {
  const { status } = useAuth();
  const isAuthenticated = status === "authenticated";

  return (
    <div className="relative overflow-hidden bg-[#040713] text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-36 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(95,139,255,0.18),transparent_70%)] blur-3xl" />
        <div className="absolute -bottom-40 right-[18%] h-[420px] w-[420px] rounded-full bg-[radial-gradient(circle,rgba(154,77,255,0.2),transparent_70%)] blur-3xl" />
      </div>

      <Container className="relative z-10 py-20 sm:py-24">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-5 text-center">
          <Badge className="border-white/15 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-white/70 backdrop-blur">
            AI-first workflow
          </Badge>
          <h1 className="text-balance text-4xl font-semibold leading-tight sm:text-6xl">
            Enhance learning with
            <span className="mt-1 block bg-linear-to-r from-[#5f8bff] via-[#7c5dff] to-[#9a4dff] bg-clip-text text-transparent">
              AUGUSTUS
            </span>
          </h1>
          <p className="text-pretty text-sm text-white/70 sm:text-base">
            AugustuS is your conversational copilot that answers with citations, understands context, and automates follow-up workflows in seconds.
          </p>
        </div>

        <div className="mx-auto mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {isAuthenticated ? (
            <>
              <Button
                asChild
                className="rounded-full bg-linear-to-r from-[#5f8bff] via-[#7c5dff] to-[#9a4dff] px-6 py-2.5 text-white shadow-[0_16px_40px_rgba(100,149,255,0.45)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_55px_rgba(100,149,255,0.55)]"
              >
                <Link href="/app">Go to dashboard</Link>
              </Button>
              <Button
                asChild
                variant="secondary"
                className="rounded-full border border-white/20 bg-white/10 px-6 py-2.5 text-white transition duration-300 hover:-translate-y-0.5 hover:bg-white/18 hover:border-white/35"
              >
                <Link href="/app/videos/new">New video</Link>
              </Button>
            </>
          ) : (
            <>
              <Button
                asChild
                className="rounded-full bg-linear-to-r from-[#5f8bff] via-[#7c5dff] to-[#9a4dff] px-6 py-2.5 text-white shadow-[0_16px_40px_rgba(100,149,255,0.45)] transition-all hover:-translate-y-0.5 hover:shadow-[0_22px_55px_rgba(100,149,255,0.55)]"
              >
                <Link href="/auth/sign-up">Start for free</Link>
              </Button>
              <Button
                asChild
                variant="secondary"
                className="rounded-full border border-white/20 bg-white/10 px-6 py-2.5 text-white transition duration-300 hover:-translate-y-0.5 hover:bg-white/18 hover:border-white/35"
              >
                <Link href="/auth/sign-in">Sign in</Link>
              </Button>
            </>
          )}
        </div>

        <div className="mx-auto mt-10 grid max-w-3xl grid-cols-1 gap-4 text-left sm:grid-cols-3">
          <Card className="border-white/10 bg-white/5 backdrop-blur">
            <CardContent className="space-y-2 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-white/45">Adoption</p>
              <p className="text-3xl font-semibold text-white">82%</p>
              <p className="text-xs text-white/55">Teams using AugustuS weekly.</p>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5 backdrop-blur">
            <CardContent className="space-y-2 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-white/45">Response time</p>
              <p className="text-3xl font-semibold text-white">~1.2s</p>
              <p className="text-xs text-white/55">Latency for reasoning over 60-minute transcripts.</p>
            </CardContent>
          </Card>
          <Card className="border-white/10 bg-white/5 backdrop-blur">
            <CardContent className="space-y-2 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-white/45">Retention</p>
              <p className="text-3xl font-semibold text-white">94%</p>
              <p className="text-xs text-white/55">Customers who expand in 90 days.</p>
            </CardContent>
          </Card>
        </div>
      </Container>
    </div>
  );
}
