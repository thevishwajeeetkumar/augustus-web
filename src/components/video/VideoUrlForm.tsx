"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/app/hooks/useAuth";

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
  const { signOut } = useAuth();
  const [url, setUrl] = React.useState("");
  const [query, setQuery] = React.useState("");
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
      const finalQuery = query.trim() || initialQuery;
      // Use Next.js API route instead of direct backend call
      // This ensures proper auth handling, error handling, and cookie forwarding
      let res: Response;
      try {
        res = await fetch("/api/agent/query", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: finalQuery, url }),
          credentials: "include",
          redirect: "error", // Fail on redirects - API should never redirect
        });
      } catch (fetchErr) {
        // If redirect: "error" is set and a redirect occurs, fetch will throw
        if (fetchErr instanceof TypeError && fetchErr.message.includes("redirected")) {
          console.error("Request was redirected:", fetchErr);
          setError("Server returned an unexpected redirect. This usually indicates a configuration error.");
          return;
        }
        // Re-throw other fetch errors
        throw fetchErr;
      }

      // Check if response was redirected (shouldn't happen with redirect: "error", but check anyway)
      if (res.redirected) {
        console.error("Response was redirected to:", res.url);
        setError("Server returned an unexpected redirect. Please try again.");
        return;
      }

      // Read response body once - we can only read it once
      let text: string;
      try {
        text = await res.text();
      } catch (readErr) {
        console.error("Failed to read response body:", readErr);
        setError(`Failed to read server response (status ${res.status})`);
        return;
      }

      // Check content-type to ensure we're getting JSON
      const contentType = res.headers.get("content-type");
      if (contentType && !contentType.includes("application/json")) {
        console.error("Received non-JSON response:", contentType, "Response text:", text.substring(0, 200));
        setError(`Server returned invalid response type. Expected JSON, got ${contentType}. Response: ${text.substring(0, 200)}`);
        return;
      }

      // Safely parse response - handle non-JSON responses
      let data: AgentOk | AgentErr | { error: string; detail?: string };
      if (!text.trim()) {
        // Empty response
        data = { error: `Server returned empty response (status ${res.status})` };
      } else {
        try {
          data = JSON.parse(text) as AgentOk | AgentErr | { error: string; detail?: string };
        } catch {
          // Non-JSON response
          console.error("Failed to parse JSON response. Response text:", text.substring(0, 500));
          data = { error: `Server returned invalid JSON response. Response: ${text.substring(0, 200)}` };
        }
      }

      if (!res.ok) {
        // Handle 401 - session expired
        if (res.status === 401) {
          const msg = "error" in data && data.error 
            ? data.error 
            : "Session expired. Please sign in again.";
          setError(msg);
          // Redirect to sign-in after a delay
          setTimeout(() => {
            signOut();
          }, 2000);
          return;
        }

        // Backend uses {"detail": "message"} format
        const msg = "detail" in data && data.detail 
          ? data.detail 
          : "error" in data && data.error 
          ? data.error 
          : `Failed (status ${res.status}).`;
        setError(msg);
        return;
      }

      if ("error" in data) {
        setError(data.error);
        return;
      }

      // Validate response has required fields
      if (!data.session_id) {
        setError("Invalid response: missing session_id");
        return;
      }

      const sessionId = data.session_id;
      // Extract videoId with fallback - ensure it's never undefined
      const extractedId = extractVideoId(url);
      const videoId = data.video_context ?? extractedId;

      // Validate videoId before navigation
      if (!videoId || videoId.trim() === "") {
        console.error("Failed to extract videoId from URL:", url);
        setError("Failed to extract video ID from YouTube URL. Please check the URL format.");
        return;
      }

      if (onSuccess) onSuccess(sessionId, videoId, data.answer);
      else router.replace(`/app/query`);
    } catch (err) {
      console.error("VideoUrlForm error:", err);
      const errorMsg = err instanceof Error ? err.message : "Network error. Please try again.";
      setError(errorMsg);
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
