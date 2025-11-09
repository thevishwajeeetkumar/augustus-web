import { Container } from "@/components/layout/Container";

const LOGOS: readonly string[] = ["Logopipsum", "Logopipsum", "Logopipsum", "Logopipsum", "Logopipsum"];

export function LogosRow() {
  return (
    <div className="bg-[#0a0f1c]">
      <Container className="py-10">
        <div className="flex flex-wrap items-center justify-center gap-4">
          {LOGOS.map((l, i) => (
            <div
              key={`${l}-${i}`}
              className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs text-white/70"
            >
              {l}
            </div>
          ))}
        </div>
      </Container>
    </div>
  );
}
