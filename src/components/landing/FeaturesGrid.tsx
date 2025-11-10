import { Container } from "@/components/layout/Container";
import { Card, CardContent } from "@/components/ui/card";
import { Brain, Layers3, Workflow } from "lucide-react";

type Feature = {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  badge: string;
};

const FEATURES: readonly Feature[] = [
  {
    title: "Analyze any YouTube link",
    description:
      "Paste a URL and AugustuS handles transcripts, translations, chunking, and embeddings so you can start asking questions immediately.",
    icon: Layers3,
    badge: "Ingest",
  },
  {
    title: "Ask contextual questions",
    description:
      "Conversational RAG delivers source-linked answers, understands follow-ups, and cites the exact clip that informed every response.",
    icon: Brain,
    badge: "Copilot",
  },
  {
    title: "Resume saved sessions",
    description:
      "Every conversation stays synced to its original video, so you can pick up where you left off with history, tools, and citations intact.",
    icon: Workflow,
    badge: "Memory",
  },
];

export function FeaturesGrid() {
  return (
    <section
      id="features"
      className="relative overflow-hidden bg-[linear-gradient(120deg,#040916_0%,#07112b_55%,#0d1a3c_100%)] py-16 sm:py-20 text-white"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute -top-32 left-1/2 h-64 w-[660px] -translate-x-1/2 bg-[radial-gradient(circle,rgba(95,139,255,0.26),transparent_72%)] blur-[130px]" />
        <div className="absolute bottom-[-25%] right-[-8%] h-[440px] w-[440px] rounded-full bg-[radial-gradient(circle,rgba(122,93,255,0.2),transparent_70%)] blur-[115px]" />
      </div>
      <Container className="relative z-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs uppercase tracking-[0.35em] text-white/50">Why teams switch</p>
          <h2 className="mt-2 text-3xl font-semibold sm:text-4xl">
            Everything your learners need in a single AI-native workspace
          </h2>
          <p className="mt-3 text-sm text-white/70 sm:text-base">
            AugustuS fuses retrieval, reasoning, and creation into one loop so your videos become living knowledge bases.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {FEATURES.map(({ title, description, icon: Icon, badge }) => (
            <Card
              key={title}
              className="group relative overflow-hidden border border-white/10 bg-white/5 backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/10 cursor-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAyNCAyNCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBmaWxsPSIjZmZmZmZmIj48cGF0aCBkPSJNMTEuOTggMi44N2MtNC44MiAwLTguNzMgMy45Mi04LjczIDguNzMgMCA0LjgxIDMuOTEgOC43MyA4LjczIDguNzMgNC44MiAwIDguNzMtMy45MiA4LjczLTguNzMgMHMtMy45MS04LjczLTguNzMtOC43M3pNMTIgMTRhMSAxIDAgMCAxIDAtMiAxIDEgMCAwIDEgMCAyem0wLTQuNWEuNzUuNzUgMCAwIDEtLjc1LS43NXMuNzUtMy4zNS43NSAzLjM1YS43NS43NSAwIDAgMS0uNzUuNzV6Ii8+PC9zdmc+'),pointer]"
            >
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <div className="absolute -right-10 top-0 h-40 w-40 rounded-full bg-[#5f8bff]/20 blur-3xl" />
                <div className="absolute -bottom-16 left-0 h-32 w-32 rounded-full bg-[#9a4dff]/25 blur-3xl" />
              </div>
              <CardContent className="relative space-y-4 p-6">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/60">
                  {badge}
                </span>
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-[#101a32] text-white">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">{title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-white/75">{description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
