"use client";

import * as React from "react";
import { VideoUrlForm } from "@/components/video/VideoUrlForm";
import { MessageList, type ChatMessage } from "@/components/chat/MessageList";
import { MessageComposer } from "@/components/chat/MessageComposer";
import { useAuth } from "@/app/hooks/useAuth";
import { cn } from "@/lib/utils";

type AgentResponse = {
  answer: string;
  session_id: string;
  video_context?: string;
};

export default function QueryPage() {
  const { signOut } = useAuth();
  const [sessionId, setSessionId] = React.useState("");
  const [videoId, setVideoId] = React.useState("");
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showVideoForm, setShowVideoForm] = React.useState(true);

  function handleVideoSuccess(sessionId: string, videoId: string) {
    setSessionId(sessionId);
    setVideoId(videoId);
    setShowVideoForm(false);
  }

  async function sendToAgent(prompt: string, url?: string) {
    setError(null);
    const humanMsg: ChatMessage = {
      id: `m_${Date.now()}`,
      role: "human",
      content: prompt,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, humanMsg]);
    setBusy(true);

    try {
      const body: { query: string; session_id?: string; url?: string } = {
        query: prompt,
      };
      if (sessionId) body.session_id = sessionId;
      if (url) body.url = url;

      const res = await fetch("/api/agent/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });

      const data = (await res.json()) as AgentResponse | { error: string; detail?: string };

      if (!res.ok) {
        if (res.status === 401) {
          const msg = ("error" in data && data.error) || "Session expired. Please sign in again.";
          setError(msg);
          setMessages((m) => [
            ...m,
            {
              id: `e_${Date.now()}`,
              role: "ai",
              content: `⚠️ ${msg}`,
              createdAt: new Date().toISOString(),
            },
          ]);
          setTimeout(() => {
            signOut();
          }, 2000);
          return;
        }

        const msg = "detail" in data && data.detail 
          ? data.detail 
          : "error" in data && data.error 
          ? data.error 
          : `Request failed (status ${res.status}).`;
        setError(msg);
        setMessages((m) => [
          ...m,
          {
            id: `e_${Date.now()}`,
            role: "ai",
            content: `⚠️ ${msg}`,
            createdAt: new Date().toISOString(),
          },
        ]);
        return;
      }

      if ("error" in data) {
        const msg = data.error;
        setError(msg);
        setMessages((m) => [
          ...m,
          {
            id: `e_${Date.now()}`,
            role: "ai",
            content: `⚠️ ${msg}`,
            createdAt: new Date().toISOString(),
          },
        ]);
        return;
      }

      setSessionId(data.session_id);
      if (data.video_context && !videoId) {
        setVideoId(data.video_context);
        setShowVideoForm(false);
      }
      setMessages((m) => [
        ...m,
        {
          id: `a_${Date.now()}`,
          role: "ai",
          content: data.answer,
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch {
      setError("Network error. Please try again.");
      setMessages((m) => [
        ...m,
        {
          id: `e_${Date.now()}`,
          role: "ai",
          content: "⚠️ Network error. Please try again.",
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative space-y-8">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-white/15 to-transparent" />
        <div className="absolute -top-28 left-1/2 h-[420px] w-[420px] -translate-x-1/2 bg-[radial-gradient(circle,rgba(95,139,255,0.24),transparent_70%)] blur-[120px]" />
        <div className="absolute bottom-[-30%] right-[16%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(122,93,255,0.2),transparent_70%)] blur-[110px]" />
      </div>
      
      <header className="relative z-10 space-y-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-white/55">
          Query
        </span>
        <h1 className="text-3xl font-semibold">Ask AugustuS</h1>
        <p className="max-w-2xl text-sm text-white/65">
          Ask questions about your videos or general queries. Optionally provide a YouTube URL to analyze a new video.
        </p>
      </header>

      <div className="relative z-10 space-y-6">
        {showVideoForm && (
          <div className="max-w-2xl">
            <VideoUrlForm
              initialQuery="Analyze this video"
              onSuccess={handleVideoSuccess}
            />
          </div>
        )}

        <div className="h-[calc(100vh-20rem)]">
          <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/12 bg-[#0b1120]/75 shadow-[0_26px_85px_rgba(12,18,45,0.55)]">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(95,139,255,0.18),transparent_55%),radial-gradient(circle_at_bottom,rgba(154,77,255,0.16),transparent_60%)]" />
            <div className="relative z-10 flex h-full flex-col">
              <div className="flex items-center justify-between border-b border-white/12 px-6 py-4">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.25em] text-white/45">
                    {videoId ? `Video ${videoId}` : "Active session"}
                  </p>
                  {sessionId && (
                    <div className="mt-1 flex items-center gap-2 text-sm text-white">
                      <span className="text-xs text-white/45">Session {sessionId.slice(0, 8)}…</span>
                    </div>
                  )}
                </div>
                <div
                  className={cn(
                    "rounded-full border px-3 py-1 text-[11px] uppercase tracking-wide",
                    busy
                      ? "border-amber-500/40 bg-amber-500/15 text-amber-200"
                      : "border-emerald-500/35 bg-emerald-500/12 text-emerald-200"
                  )}
                >
                  {busy ? "Thinking…" : "Ready"}
                </div>
              </div>
              <div className="flex h-full flex-col gap-4 px-5 py-5">
                <MessageList messages={messages} />
                <div className="space-y-3">
                  <MessageComposer disabled={busy} onSend={(text) => sendToAgent(text)} />
                  {error ? (
                    <div className="flex items-center rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                      {error}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

