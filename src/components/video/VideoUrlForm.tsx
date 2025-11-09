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
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="videoUrl">YouTube URL</Label>
        <Input
          id="videoUrl"
          name="videoUrl"
          placeholder="https://www.youtube.com/watch?v=..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" className="rounded-full text-gray-900" disabled={loading}>
        {loading ? "Processing…" : "Analyze video"}
      </Button>
    </form>
  );
}

function extractVideoId(u: string): string {
  const m = u.match(YT_REGEX);
  return (m?.[6] ?? "").replace(/[^A-Za-z0-9_\-]/g, "");
}
