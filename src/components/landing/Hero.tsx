import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function Hero() {
  return (
    <div className="relative overflow-hidden bg-[#0a0f1c] text-white">
      <Container className="relative z-10 py-16 sm:py-20">
        <div className="mb-6 flex items-center justify-center gap-3">
          <Badge className="bg-white/10 text-white border-white/20">
            Simplify your workflow
          </Badge>
        </div>

        <h1 className="mx-auto max-w-3xl text-center text-3xl font-semibold leading-tight sm:text-5xl">
          Enhance your <span className="text-white/90">learning control</span> with Augustus
        </h1>

        <p className="mx-auto mt-4 max-w-2xl text-center text-sm text-white/70 sm:text-base">
          Turn YouTube videos into interactive lessons. Ask questions, get context-aware answers,
          and keep your conversation memory across sessions.
        </p>

        <div className="mt-7 flex items-center justify-center gap-3">
          <Button asChild className="rounded-full text-gray-900">
            <Link href="/auth/sign-up">Free Trial</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full border-white/20 text-white hover:bg-white/10">
            <Link href="/auth/sign-in">Sign in</Link>
          </Button>
        </div>

        {/* Decorative metric cards (match template vibe) */}
        <div className="mx-auto mt-10 grid max-w-4xl grid-cols-1 gap-4 sm:grid-cols-2">
          <Card className="border-white/10 bg-white/5 backdrop-blur">
            <CardContent className="p-5">
              <div className="text-xs text-white/60">Sessions resumed</div>
              <div className="mt-2 text-2xl font-semibold">99.9%</div>
              <div className="mt-3 text-xs text-white/50">Seamless context across videos</div>
            </CardContent>
          </Card>

          <Card className="border-white/10 bg-white/5 backdrop-blur">
            <CardContent className="p-5">
              <div className="text-xs text-white/60">Average response time</div>
              <div className="mt-2 text-2xl font-semibold">~1.2s</div>
              <div className="mt-3 text-xs text-white/50">Optimized RAG + agent orchestration</div>
            </CardContent>
          </Card>
        </div>
      </Container>

      {/* Soft radial glows */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 left-1/2 h-[600px] w-[600px] -translate-x-1/2 rounded-full blur-3xl bg-[radial-gradient(closest-side,rgba(86,132,255,0.25),transparent_70%)]" />
        <div className="absolute -bottom-40 right-1/4 h-[500px] w-[500px] rounded-full blur-3xl bg-[radial-gradient(closest-side,rgba(0,198,255,0.18),transparent_70%)]" />
      </div>
    </div>
  );
}
