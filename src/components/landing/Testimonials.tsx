import { Container } from "@/components/layout/Container";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

type Testimonial = {
  quote: string;
  name: string;
  title: string;
  avatar: string;
};

const TESTIMONIALS: readonly Testimonial[] = [
  {
    quote:
      "AugustuS helped our enablement team turn launch videos into living playbooks. Reps now ask the AI before they ping managers—and we saw ramp time drop by 27%.",
    name: "Priya Sharma",
    title: "Director of Sales Enablement · Hublink",
    avatar: "https://i.pravatar.cc/120?img=14",
  },
  {
    quote:
      "Within two weeks, we had a private deployment ingesting every demo call. Our product managers now query competitors’ clips with natural language and get citations instantly.",
    name: "James Liu",
    title: "Head of Product Research · Nimbus Labs",
    avatar: "https://i.pravatar.cc/120?img=5",
  },
  {
    quote:
      "We used AugustuS to build self-paced compliance refreshers. The AI pulls the exact 15-second video segments employees need, and completion scores jumped to 94%.",
    name: "Elena Martínez",
    title: "L&D Lead · Brightstone Health",
    avatar: "https://i.pravatar.cc/120?img=32",
  },
];

export function Testimonials() {
  return (
    <section className="relative overflow-hidden bg-[linear-gradient(160deg,#040914_0%,#07112b_55%,#0d1a3c_100%)] py-20 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(95,139,255,0.15),transparent_60%),radial-gradient(circle_at_bottom,rgba(154,77,255,0.15),transparent_65%)]" />
      <Container className="relative z-10 space-y-12">
        <div className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.3em] text-white/50">
            Success stories
          </span>
          <h2 className="mt-5 text-3xl font-semibold sm:text-4xl">
            Teams turn their video libraries into living knowledge bases
          </h2>
          <p className="mt-3 text-sm text-white/70 sm:text-base">
            From scale-ups to global enterprises, AugustuS brings conversational intelligence to every learning moment.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {TESTIMONIALS.map((testimonial) => (
            <Card
              key={testimonial.name}
              className="relative h-full cursor-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjQiIGhlaWdodD0iMjQiIHZpZXdCb3g9IjAgMCAzMCAzMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBmaWxsPSIjZmZmZmZmIj48cGF0aCBkPSJNMTUgMjFDMTγηMTUgNyAwMS45IDEyIDcgMTVTLy4zIDEyIDcuOEZhMSAxIDAgMCAxLTggMTNBMTQgMTQgMCAwIDAgMjIgOCAxNCAxNCAwIDAgMCAyIDhBMiAyIDAgMCAxIDEwIDE5djIgYTIgMiAwIDAgMCAyIDJoNnptLTUgOEgxMHYtMWgxeiIvPjwvc3ZnPg=='),pointer] border border-white/10 bg-[#0b1120]/75 backdrop-blur transition-all duration-300 hover:-translate-y-2 hover:border-white/20 hover:shadow-[0_25px_70px_rgba(15,23,42,0.65)]"
            >
              <CardContent className="flex h-full flex-col gap-6 p-7">
                <p className="text-sm leading-relaxed text-white/80">
                  “{testimonial.quote}”
                </p>
                <div className="flex items-center gap-4">
                  <Image
                    src={testimonial.avatar}
                    alt={testimonial.name}
                    width={56}
                    height={56}
                    className="h-14 w-14 rounded-full object-cover"
                  />
                  <div>
                    <div className="text-sm font-semibold text-white">{testimonial.name}</div>
                    <div className="text-xs text-white/60">{testimonial.title}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </Container>
    </section>
  );
}

