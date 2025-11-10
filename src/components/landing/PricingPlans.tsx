import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Sparkles } from "lucide-react";

type Plan = {
  name: string;
  price: string;
  description: string;
  features: readonly string[];
  cta: string;
  highlighted?: boolean;
};

const PLANS: readonly Plan[] = [
  {
    name: "Starter",
    price: "Free",
    description: "Get to know augusTus with essential tools for casual learners.",
    features: [
      "3 video analyses per week",
      "Chat memory for each session",
      "Baseline transcripts & summaries",
    ],
    cta: "Start for free",
  },
  {
    name: "Growth",
    price: "$19/mo",
    description: "Unlock faster responses and deeper reasoning for power users.",
    features: [
      "Unlimited video analyses",
      "Enhanced reasoning with web search",
      "Workspace sharing for small teams",
    ],
    cta: "Upgrade to Growth",
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Let’s talk",
    description: "Tailored deployments, compliance reviews, and dedicated support.",
    features: [
      "Custom limits & SLAs",
      "Private cloud / on-prem options",
      "SSO + detailed audit logging",
    ],
    cta: "Contact sales",
  },
];

export function PricingPlans() {
  return (
    <section
      id="pricing"
      className="relative overflow-hidden bg-[linear-gradient(120deg,#040916_0%,#07112b_55%,#0d1a3c_100%)] py-20 text-white"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute -top-36 left-1/2 h-64 w-[700px] -translate-x-1/2 bg-[radial-gradient(circle,rgba(95,139,255,0.28),transparent_72%)] blur-[140px]" />
        <div className="absolute bottom-[-30%] right-[-12%] h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle,rgba(122,93,255,0.22),transparent_70%)] blur-[120px]" />
      </div>
      <Container className="relative z-10 space-y-12">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex items-center justify-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-white/55">
            Pricing
          </span>
          <h2 className="mt-4 text-3xl font-semibold sm:text-4xl">
            Choose the plan that scales with your team
          </h2>
          <p className="mt-3 text-sm text-white/70 sm:text-base">
            Start with the essentials, then unlock advanced collaboration and security when you need it.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <Card
              key={plan.name}
              className={`relative overflow-hidden border border-white/10 bg-[#0b1120]/70 transition-all duration-300 hover:-translate-y-2 hover:border-white/20 hover:shadow-[0_30px_60px_rgba(15,23,42,0.65)] cursor-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjIiIGhlaWdodD0iMjIiIHZpZXdCb3g9IjAgMCAzMCAzMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBmaWxsPSIjZmZmZmZmIj48cGF0aCBkPSJNMjQuMjIgMTBsLTguNzIgNi4wM3YuMDAyTDEwLjQ3IDR6TTI1LjY0IDQuODhsLTYuMTMgMTcuNTFhMS40NSAxLjQ1IDAgMCAxLTIuNDMtLjM0bC0yLjYzLTMuNThDNS4zMyAyMC43MiAyLjY3IDI0Ljg3Ljg1IDI4LjM1QTQuNDggNC40OCAwIDAgMC0yIDEwLjY0QTUuNTIgNS41MiAwIDAgMCA4LjA3IDFDMTEuMTQgMS4zMiAxMy44NSAyLjgyIDE2LjA1IDQuMTdhMS40NSAxLjQ1IDAgMCAxIC4zOSAxLjg1TDIxLjhhLjMyLjMyIDAgMCAwIDAuMSAwLjJiLS4wMy4xNy0uMDMgLjM0IDAgLjUxYS4yOS4yOSAwIDAgMCAuMDkuM2EuMy4zIDAgMCAwIC4xNS4wNWguMDEuMDFhLjMxLjMxIDAgMCAwIC4xNi0uMDNsNi40Ny00LjA1YTYgNiAwIDAgMCAuNjItNy44NyA1Ljg3IDUuODcgMCAwIDAtNy41Ny0uNzV6IiIvPjwvc3ZnPg=='),pointer] ${
                plan.highlighted ? "ring-2 ring-[#7c5dff]/50" : ""
              }`}
            >
              {plan.highlighted ? (
                <div className="pointer-events-none absolute inset-0 opacity-90">
                  <div className="absolute inset-0 bg-linear-to-br from-[#5f8bff]/25 via-[#7c5dff]/20 to-[#9a4dff]/25 blur-3xl" />
                </div>
              ) : null}
              <CardHeader className="relative space-y-6 p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-xl font-semibold">
                      {plan.name}
                    </CardTitle>
                    <p className="mt-2 text-sm text-white/70">{plan.description}</p>
                  </div>
                  {plan.highlighted ? (
                    <span className="inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white">
                      <Sparkles className="h-3.5 w-3.5" /> Popular
                    </span>
                  ) : null}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3 text-sm text-white/75">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-4.5 w-4.5 text-emerald-300" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={plan.highlighted ? "default" : "secondary"}
                  className="w-full rounded-full"
                  asChild
                >
                  <Link href={plan.name === "Enterprise" ? "/contact" : "/auth/sign-up"}>
                    {plan.cta}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
