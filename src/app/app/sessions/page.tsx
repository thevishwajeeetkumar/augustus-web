import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";

/**
 * When you expose /api/sessions (proxying FastAPI), replace this with a real fetch
 * and render a grid of <SessionCard /> items.
 */
export default function SessionsPage() {
  return (
    <div className="relative space-y-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-white/15 to-transparent" />
        <div className="absolute -top-28 left-1/2 h-[420px] w-[420px] -translate-x-1/2 bg-[radial-gradient(circle,rgba(154,77,255,0.24),transparent_72%)] blur-[120px]" />
        <div className="absolute bottom-[-30%] right-[16%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(95,139,255,0.2),transparent_70%)] blur-[110px]" />
      </div>
      <header className="relative z-10 space-y-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-white/55">
          Memory
        </span>
        <h1 className="text-3xl font-semibold">Sessions</h1>
        <p className="max-w-2xl text-sm text-white/65">
          Every conversation with AugustuS stays synced to its original video. Resume exactly where you left off, complete with tools and citations.
        </p>
      </header>
      <div className="relative z-10">
        <EmptyState
          title="No sessions to show"
          description="Once you start chatting with a video, your sessions will appear here."
          action={
            <Button asChild className="rounded-full">
              <Link href="/app/videos/new">Analyze a video</Link>
            </Button>
          }
        />
      </div>
    </div>
  );
}
