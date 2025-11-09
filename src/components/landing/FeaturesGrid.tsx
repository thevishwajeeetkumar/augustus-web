import { Container } from "@/components/layout/Container";
import { Card, CardContent } from "@/components/ui/card";

type Feature = {
  title: string;
  description: string;
};

const FEATURES: readonly Feature[] = [
  {
    title: "Link a video",
    description: "Paste a YouTube URL and let Augustus fetch transcripts, translate if needed, and prepare the context.",
  },
  {
    title: "Ask anything",
    description: "Chat with the video content using RAG; the agent picks web search when the answer isn’t in the video.",
  },
  {
    title: "Keep context",
    description: "Sessions remember your conversation so follow-ups work without re-pasting the link.",
  },
];

export function FeaturesGrid() {
  return (
    <section id="features" className="bg-[#0a0f1c] py-12 sm:py-16 lg:py-20 text-white">
      <Container>
        <div className="mb-6">
          <div className="text-xs text-white/60">Our workflow</div>
          <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">How Augustus makes learning easier</h2>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <Card key={f.title} className="border-white/10 bg-white/5">
              <CardContent className="p-5">
                <div className="h-8 w-8 rounded-lg bg-white/10" />
                <h3 className="mt-4 text-base font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-white/70">{f.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}
