"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type AgentOk = { answer: string; session_id: string; video_context?: string };
type AgentErr = { error: string };

const YT_REGEX =
  /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.be)\/(watch\?v=|embed\/|v\/|shorts\/)?([A-Za-z0-9_\-]{6,})/;

type Props = {
  /** Optional: override default initial query sent to backend */
  initialQuery?: string;
  /** Optional: custom success handler */
  onSuccess?: (sessionId: string, videoId: string, answer?: string) => void;
};

export function VideoUrlForm({ initialQuery = "Analyze this video", onSuccess }: Props) {
  const router = useRouter();
  const [url, setUrl] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!YT_REGEX.test(url)) {
      setError("Please enter a valid YouTube URL.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/agent/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: initialQuery, url }),
      });

      const data = (await res.json()) as AgentOk | AgentErr;

      if (!res.ok || "error" in data) {
        const msg = "error" in data ? data.error : `Failed (status ${res.status}).`;
        setError(msg);
        return;
      }

      const sessionId = data.session_id;
      const videoId = data.video_context ?? extractVideoId(url);

      if (onSuccess) onSuccess(sessionId, videoId, data.answer);
      else router.replace(`/app/videos/${videoId}`);
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b1120]/70 p-6 shadow-[0_20px_65px_rgba(15,23,42,0.6)] backdrop-blur"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(95,139,255,0.15),transparent_60%)]" />
      <div className="relative z-10 space-y-5">
        <div>
          <Label htmlFor="videoUrl" className="text-xs uppercase tracking-[0.2em] text-white/60">
            YouTube URL
          </Label>
          <Input
            id="videoUrl"
            name="videoUrl"
            placeholder="https://www.youtube.com/watch?v=..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={loading}
            required
            className="mt-2 h-12 rounded-2xl border-white/10 bg-[#101a32]/70 px-4 text-sm text-white placeholder:text-white/40 focus-visible:border-white/40"
          />
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">
            {error}
          </div>
        ) : (
          <p className="text-xs text-white/50">
            Paste any YouTube link. We’ll fetch the transcript, translate, chunk, and embed it automatically.
          </p>
        )}

        <Button
          type="submit"
          className="w-full rounded-full bg-linear-to-br from-[#5f8bff] via-[#7c5dff] to-[#9a4dff] py-2.5 text-white shadow-[0_18px_45px_rgba(100,149,255,0.45)] hover:-translate-y-0.5 transition disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Processing…" : "Analyze video"}
        </Button>
      </div>
    </form>
  );
}

function extractVideoId(u: string): string {
  const m = u.match(YT_REGEX);
  return (m?.[6] ?? "").replace(/[^A-Za-z0-9_\-]/g, "");
}
