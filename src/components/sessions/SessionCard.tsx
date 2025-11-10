import Link from "next/link";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Clock3, Play } from "lucide-react";

type Props = {
  sessionId: string;
  videoId: string;
  title?: string;
  lastActivity?: string; // ISO or readable
};

export function SessionCard({ sessionId, videoId, title, lastActivity }: Props) {
  const thumb = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

  return (
    <Link
      href={`/app/videos/${videoId}`}
      className="group relative block cursor-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjIiIGhlaWdodD0iMjIiIHZpZXdCb3g9IjAgMCA0OCA0OCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBmaWxsPSIjZmZmZmZmIj48cGF0aCBkPSJNNDQuMjMgMTQuNzJIMzEuMzJsMy44NiAzLjg2LTEuNDEgMS40MS01LjI3LTUuMjd2MTIuOTEhcy0xLjkgMS45LTQgMXYzMmMxMS44LTQgNC03LjYtN2EzLjIgMy4yIDAgMCAwLTMgMkgzLjc3TDMgMmw0Ljg4LTQuODhBMiAxIDAgMCAwIDMuOTIgOGw3LjIxIDhINC4wOGE0LjEyIDQuMTIgMCAwIDAgMC4xMSA4LjNsMTUuNTggMTUuNThhNC4xMiA0LjEyIDAgMCAwIDUuODIgMGwxMS4xNS0xMS4xNSAxMi44IDMuMSAxMS4wNSAxMi4wN0wyOS43IDI1LjUxYy0yLjA3IDIuMDcgMCA1LjYgMi45MSAxMS4xNHY0Ljg4aDEwLjc3TDE4IDcwYy0xLjYgMS42LS40IDQgMS40IDRoMTIuNzFMMzIgMzIuNzMgMzIgMzMgMzcuODkgMzcuMzAgMjIuMzMgMjIuMzQtdh4tNC4yMiA1o-My0yIDAuOTQ0IEIAUjk4MngyNHoiLz48L3N2Zz4='),pointer] transition-transform duration-300 hover:-translate-y-1"
    >
      <Card className="relative overflow-hidden border border-white/10 bg-[#0b1120]/70 transition-all duration-300 group-hover:border-white/25 group-hover:shadow-[0_25px_70px_rgba(15,23,42,0.65)]">
        <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="absolute -left-10 top-0 h-32 w-32 rounded-full bg-[#5f8bff]/20 blur-3xl" />
          <div className="absolute -bottom-16 right-0 h-32 w-32 rounded-full bg-[#9a4dff]/25 blur-3xl" />
        </div>
        <CardContent className="relative flex gap-4 p-4">
          <div className="relative overflow-hidden rounded-2xl border border-white/10">
            <Image
              src={thumb}
              alt={title || `Thumbnail for ${videoId}`}
              width={224}
              height={126}
              className="h-24 w-40 object-cover transition duration-300 group-hover:scale-105"
              priority={false}
            />
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-6 text-[11px] uppercase tracking-wide text-white/70">
              <span className="flex items-center gap-1">
                <Play className="h-3 w-3 text-white/60" /> {videoId}
              </span>
              <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-white/70">
                {sessionId.slice(0, 6)}…
              </span>
            </div>
          </div>
          <div className="flex min-w-0 flex-1 flex-col justify-between">
            <div>
              <h3 className="truncate text-sm font-semibold text-white group-hover:text-white">
                {title || `Session ${sessionId.slice(0, 10)}…`}
              </h3>
              <p className="mt-2 line-clamp-2 text-xs text-white/60">
                Continue your conversation and pick up exactly where you left off with this video.
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between text-[11px] text-white/50">
              {lastActivity ? (
                <span className="flex items-center gap-1">
                  <Clock3 className="h-3.5 w-3.5" /> {formatDate(lastActivity)}
                </span>
              ) : (
                <span className="flex items-center gap-1 text-white/50">
                  <Clock3 className="h-3.5 w-3.5" /> Recently created
                </span>
              )}
              <span className="rounded-full border border-white/20 bg-white/5 px-2 py-0.5 text-white/60 transition group-hover:border-white/40 group-hover:text-white">
                Resume
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function formatDate(d: string) {
  const date = new Date(d);
  return isNaN(date.getTime()) ? d : date.toLocaleString();
}
