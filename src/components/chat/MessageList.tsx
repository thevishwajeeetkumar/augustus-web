"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { ToolBadge } from "./ToolBadge";

export type ChatMessage = {
  id: string;
  role: "human" | "ai" | "system" | "tool";
  content: string;
  tool_name?: string | null;
  createdAt?: string;
};

type Props = {
  messages: ChatMessage[];
  className?: string;
};

export function MessageList({ messages, className }: Props) {
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  return (
    <div ref={scrollRef} className={`flex-1 overflow-y-auto space-y-3 ${className ?? ""}`}>
      {messages.length === 0 ? (
        <div className="text-sm text-white/60">No messages yet. Ask something about the video!</div>
      ) : (
        messages.map((m) => (
          <Card
            key={m.id}
            className={`border-white/10 bg-white/5 ${m.role === "human" ? "ml-auto max-w-[80%]" : "max-w-[80%]"}`}
          >
            <CardContent className="p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-white/60">
                  {m.role === "human" ? "You" : m.role === "ai" ? "Augustus" : m.role}
                </span>
                {m.role === "ai" && <ToolBadge tool={m.tool_name ?? undefined} />}
              </div>
              <div className="whitespace-pre-wrap text-sm text-white/90">{m.content}</div>
              {m.createdAt ? (
                <div className="mt-2 text-[10px] text-white/50">
                  {new Date(m.createdAt).toLocaleString()}
                </div>
              ) : null}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}
