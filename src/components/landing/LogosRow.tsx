import { Container } from "@/components/layout/Container";

const LOGOS = [
  {
    name: "Duolingo",
    initials: "D",
    gradient: "from-[#A5FF8C] to-[#6CDF4E]",
  },
  {
    name: "MasterClass",
    initials: "M",
    gradient: "from-white/85 to-white/60",
  },
  {
    name: "Codecademy",
    initials: "C",
    gradient: "from-[#7ad0ff] to-[#49a5ff]",
  },
  {
    name: "Brilliant",
    initials: "B",
    gradient: "from-white/80 to-white/55",
  },
  {
    name: "Coursera",
    initials: "C",
    gradient: "from-[#8ab3ff] to-[#5975ff]",
  },
  {
    name: "Pearson",
    initials: "P",
    gradient: "from-white/80 to-white/55",
  },
];

export function LogosRow() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(150deg,#040914_0%,#07112b_55%,#0d1a3c_100%)] py-14">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(95,139,255,0.2),transparent_65%),radial-gradient(circle_at_bottom,rgba(154,77,255,0.18),transparent_70%)]" />
      <Container className="relative z-10 space-y-8 text-center">
        <p className="text-xs uppercase tracking-[0.4em] text-white/50">
          trusted by modern learning teams
        </p>
        <div className="flex flex-wrap items-center justify-center gap-6">
          {LOGOS.map((logo) => (
            <div
              key={logo.name}
              className="flex h-16 items-center gap-3 rounded-full border border-white/10 bg-white/5 px-6 text-sm font-medium tracking-wide text-white/70 transition hover:border-white/25 hover:text-white"
            >
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-full bg-linear-to-br ${logo.gradient} text-sm font-semibold text-[#050914] shadow-[0_6px_20px_rgba(94,133,255,0.25)]`}
              >
                {logo.initials}
              </div>
              <span>{logo.name}</span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
