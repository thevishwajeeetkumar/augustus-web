"use client";

import * as React from "react";
import { MessageList, type ChatMessage } from "./MessageList";
import { MessageComposer } from "./MessageComposer";
import { cn } from "@/lib/utils";
import { useAuth } from "@/app/hooks/useAuth";

type AgentResponse = {
  answer: string;
  session_id: string;
  video_context?: string;
  tool_name?: string; // if backend returns it
};

type Props = {
  initialSessionId: string;
  videoId: string;
  initialMessages?: ChatMessage[];
};

export function ChatPanel({ initialSessionId, videoId, initialMessages = [] }: Props) {
  const { signOut } = useAuth();
  const [sessionId, setSessionId] = React.useState(initialSessionId);
  const [messages, setMessages] = React.useState<ChatMessage[]>(initialMessages);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function sendToAgent(prompt: string) {
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
      const res = await fetch("/api/agent/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: prompt, session_id: sessionId }),
        credentials: "include",
      });

      const data = (await res.json()) as AgentResponse | { error: string; detail?: string };

      if (!res.ok) {
        // Handle 401 - session expired
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
          // Redirect to sign-in after a delay
          setTimeout(() => {
            signOut();
          }, 2000);
          return;
        }

        // Handle other errors - backend uses {"detail": "message"} format
        const msg = "detail" in data && data.detail 
          ? data.detail 
          : "error" in data && data.error 
          ? data.error 
          : `Request failed (status ${res.status}).`;
        setError(msg);
        // Show an inline AI error bubble for continuity
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

      setSessionId(data.session_id); // in case backend rotated/updated it
      setMessages((m) => [
        ...m,
        {
          id: `a_${Date.now()}`,
          role: "ai",
          content: data.answer,
          tool_name: (data as { tool_name?: string }).tool_name ?? undefined,
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
    <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/12 bg-[#0b1120]/75 shadow-[0_26px_85px_rgba(12,18,45,0.55)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(95,139,255,0.18),transparent_55%),radial-gradient(circle_at_bottom,rgba(154,77,255,0.16),transparent_60%)]" />
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-white/12 px-6 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-white/45">
              Active session
            </p>
            <div className="mt-1 flex items-center gap-2 text-sm text-white">
              <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/75">
                Video {videoId}
              </span>
              <span className="text-xs text-white/45">Session {sessionId.slice(0, 8)}…</span>
            </div>
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
            <MessageComposer disabled={busy} onSend={sendToAgent} />
            {error ? (
              <div className="flex items-center rounded-xl border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                {error}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
