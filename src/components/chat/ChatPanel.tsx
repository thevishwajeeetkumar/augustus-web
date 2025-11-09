"use client";

import * as React from "react";
import { MessageList, type ChatMessage } from "./MessageList";
import { MessageComposer } from "./MessageComposer";

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
      });

      const data = (await res.json()) as AgentResponse | { error: string };

      if (!res.ok || "error" in data) {
        const msg = "error" in data ? data.error : `Request failed (status ${res.status}).`;
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
    <div className="flex h-full flex-col gap-3">
      <MessageList messages={messages} className="p-1" />
      <MessageComposer disabled={busy} onSend={sendToAgent} />
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
      <div className="text-[10px] text-white/40">
        Video: {videoId} • Session: {sessionId}
      </div>
    </div>
  );
}
