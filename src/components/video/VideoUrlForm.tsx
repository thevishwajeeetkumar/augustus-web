"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const YT_REGEX =
  /^(https?:\/\/)?(www\.)?(m\.)?(youtube\.com|youtu\.be)\/(watch\?v=|embed\/|v\/|shorts\/)?([A-Za-z0-9_\-]{6,})/;

type Props = {
  /** Optional: override default initial query sent to backend */
  initialQuery?: string;
  /** Custom success handler - passes videoId, videoUrl, and query */
  onSuccess?: (videoId: string, videoUrl: string, query?: string) => void;
};

export function VideoUrlForm({ initialQuery = "Analyze this video", onSuccess }: Props) {
  const [url, setUrl] = React.useState("");
  const [query, setQuery] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState(false);

  function extractVideoId(u: string): string {
    const m = u.match(YT_REGEX);
    return (m?.[6] ?? "").replace(/[^A-Za-z0-9_\-]/g, "");
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    // Prevent double submission
    if (submitted || loading) {
      return;
    }
    
    setError(null);
    setLoading(true);
    setSubmitted(true);

    if (!YT_REGEX.test(url)) {
      setError("Please enter a valid YouTube URL.");
      setLoading(false);
      setSubmitted(false);
      return;
    }

    const videoId = extractVideoId(url);
    if (!videoId || videoId.trim() === "") {
      setError("Failed to extract video ID from YouTube URL. Please check the URL format.");
      setLoading(false);
      setSubmitted(false);
      return;
    }

    // Extract video ID and pass to parent with optional query
    // ChatPanel will handle the actual API call via V2 and auto-send the query
    if (onSuccess) {
      // Use the query from form, or default to "Analyze this video" if empty
      const finalQuery = query.trim() || initialQuery || "Analyze this video";
      console.log("VideoUrlForm: Calling onSuccess with", { videoId, url, finalQuery });
      onSuccess(videoId, url, finalQuery);
      // Reset form after successful submission
      setUrl("");
      setQuery("");
      setSubmitted(false);
    }
    
    setLoading(false);
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

        <div>
          <Label htmlFor="query" className="text-xs uppercase tracking-[0.2em] text-white/60">
            Question (optional)
          </Label>
          <Textarea
            id="query"
            name="query"
            placeholder="Ask a specific question, or leave empty to analyze the video..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
            className="mt-2 min-h-24 resize-none border-white/10 bg-[#101a32]/70 text-sm text-white placeholder:text-white/40 focus-visible:border-white/40"
          />
          <p className="mt-2 text-xs text-white/40">
            Note: The question will be sent when you submit the first message in the chat.
          </p>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">
            {error}
          </div>
        ) : (
          <p className="text-xs text-white/50">
            Paste any YouTube link. We&apos;ll fetch the transcript, translate, chunk, and embed it automatically. Optionally ask a specific question about the video.
          </p>
        )}

        <Button
          type="submit"
          className="w-full rounded-full bg-linear-to-br from-[#5f8bff] via-[#7c5dff] to-[#9a4dff] py-2.5 text-white shadow-[0_18px_45px_rgba(100,149,255,0.45)] hover:-translate-y-0.5 transition disabled:opacity-50"
          disabled={loading}
        >
          {loading ? "Processing…" : "Continue"}
        </Button>
      </div>
    </form>
  );
}
