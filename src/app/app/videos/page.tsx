import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/common/EmptyState";

export default function VideosIndexPage() {
  return (
    <div className="relative space-y-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-white/15 to-transparent" />
        <div className="absolute -top-28 left-1/2 h-[420px] w-[420px] -translate-x-1/2 bg-[radial-gradient(circle,rgba(95,139,255,0.24),transparent_70%)] blur-[120px]" />
        <div className="absolute bottom-[-28%] right-[18%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(122,93,255,0.2),transparent_70%)] blur-[110px]" />
      </div>
      <header className="relative z-10 space-y-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-white/55">
          Library
        </span>
        <h1 className="text-3xl font-semibold">Your videos</h1>
        <p className="max-w-2xl text-sm text-white/65">
          All analyzed videos appear here with their active sessions, so you can jump into the exact segment you need within seconds using AugustuS.
        </p>
      </header>
      <div className="relative z-10">
        <EmptyState
          title="No videos analyzed yet"
          description="Start by analyzing a YouTube video link."
          action={
            <Button asChild className="rounded-full">
              <Link href="/app/videos/new">Analyze new video</Link>
            </Button>
          }
        />
      </div>
    </div>
  );
}
