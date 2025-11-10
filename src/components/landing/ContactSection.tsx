"use client";

import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/hooks/useAuth";

export function ContactSection() {
  const { status } = useAuth();
  const isAuthenticated = status === "authenticated";
  const demoHref = isAuthenticated
    ? "/app/videos/new"
    : "/auth/sign-in?next=%2Fapp%2Fvideos%2Fnew";

  return (
    <section
      id="contact"
      className="relative overflow-hidden bg-[linear-gradient(160deg,#040914_0%,#07112b_55%,#0d1a3c_100%)] py-20 text-white"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(95,139,255,0.18),transparent_65%),radial-gradient(circle_at_bottom,rgba(154,77,255,0.16),transparent_60%)]" />
      <Container className="relative z-10 grid gap-12 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <div className="space-y-6">
          <div className="space-y-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/50">
              Enterprise rollout
            </span>
            <h2 className="text-3xl font-semibold sm:text-4xl">
              Ready to deploy AugustuS across your organisation?
            </h2>
            <p className="text-sm text-white/70 sm:text-base">
              We partner with learning and enablement teams to launch bespoke AI workflows. Reach out and we’ll help scope the pilot that suits you best.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild className="rounded-full bg-linear-to-br from-[#5f8bff] via-[#7c5dff] to-[#9a4dff] px-6 py-2 text-white shadow-[0_20px_45px_rgba(94,133,255,0.45)] hover:-translate-y-0.5 transition">
              <Link href="/contact">Talk to us</Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              className="rounded-full border border-white/20 bg-transparent px-6 py-2 text-white hover:bg-white/10"
            >
              <Link href={demoHref}>Try the demo</Link>
            </Button>
          </div>
        </div>

        <Card className="border-white/10 bg-[#0b1120]/70 backdrop-blur">
          <CardContent className="space-y-6 p-7 text-sm text-white/75">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60">
                Talk to the team
              </h3>
              <div className="mt-3 space-y-2">
                <p>
                  <span className="font-medium text-white">Sales & Partnerships</span> — hello@chataugustus.com
                </p>
                <p>
                  <span className="font-medium text-white">Customer Success</span> — support@chataugustus.com
                </p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-white/60">
                Office hours
              </h3>
              <p className="mt-2 text-sm text-white/70">
                Monday – Friday, 9am – 6pm CET (remote-first across EU & India).
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-white/60">
              <Link href="https://x.com" className="hover:text-white">
                Twitter/X
              </Link>
              <Link href="https://www.linkedin.com" className="hover:text-white">
                LinkedIn
              </Link>
              <Link href="mailto:hello@chataugustus.com" className="hover:text-white">
                Email
              </Link>
            </div>
          </CardContent>
        </Card>
      </Container>
    </section>
  );
}
