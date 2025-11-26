"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ToolBadge } from "./ToolBadge";
import { Sparkles, User } from "lucide-react";

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
    <div
      ref={scrollRef}
      className={cn(
        "h-full space-y-4 overflow-y-auto pr-2 text-sm text-white/80 scrollbar-thin",
        className
      )}
    >
      {messages.length === 0 ? (
        <div className="flex h-full flex-col items-center justify-center rounded-2xl border border-dashed border-white/15 bg-white/5 p-6 text-center text-white/60">
          <Sparkles className="mb-3 h-6 w-6 text-white/40" />
          <p className="text-sm font-medium text-white">Start the conversation</p>
          <p className="mt-1 text-xs text-white/50">
            Ask AugustuS anything about the current video and the chat will appear here.
          </p>
        </div>
      ) : (
        messages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "flex w-full",
              m.role === "human" ? "justify-end" : "justify-start"
            )}
          >
            <div
              className={cn(
                "group relative max-w-[80%] rounded-3xl border px-4 py-3 shadow-[0_12px_40px_rgba(15,23,42,0.35)] backdrop-blur transition-transform duration-300 hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(15,23,42,0.6)]",
                m.role === "human"
                  ? "cursor-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCA0OCA0OCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBmaWxsPSIjZmZmZmZmIj48cGF0aCBkPSJNMjQgNC41QzEzLjUzIDQuNSAzIDkuNTUgMyAxNy41YzAgNC4yNyAxLjI2IDguMTcgMy40MyAxMS40M0wyLjY2IDM5LjUzYy0uMzIuNjIuMDggMS40Ny43NiAxLjQ3aDcuNjhhLjg1Ljg1IDAgMCAwIC43Ny0uNDYybDIuMzgtNC41MWMzLjI0IDEuNDMgNi44OCAyLjI4IDEwLjUzIDIuMjggMTAuNDcgMCAxOS41LTUuMDUgMTkuNS0xMy41U0M0My41IDkuNTUgMzQuNTMgNC41IDI0IDQuNXptLTYuODYgMjguMTZsLTIuNTQgNC45Mi0yLjQ4LTQuNzNjLS4yNi0uNTEtLjgtLjgzLTEuMzctLjgzSDguNDdjLTEuMTIgMC0xLjgzLTEuMjMtMS4yOC0yLjIzTDEyLjUgMjMuNTdjLjE0LjIxLjI4LjQyLjQ0LjYzczAgMS4wOS0uMzUgMS41N0wxMSAxOS44OGRjLTEuNzEtMi44OS0yLjY4LTYuMDMtMi42OC05LjM4IDAtNy4wNCA5LjA2LTEyIDItMTIgMTAuMDYgMCAxOC4wOCA0LjkyIDE4LjA4IDEycy04LjAyIDEyLTE4LjA4IDEyYy0zLjQ4IDAtNi43MjMtLjY4NS05LjY4LTEuOTg2eiIvPjwvc3ZnPg==')_20_20,auto] border-white/10 bg-linear-to-br from-[#5f8bff]/70 via-[#7c5dff]/65 to-[#9a4dff]/70 text-white"
                  : "cursor-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCA0OCA0OCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiBmaWxsPSIjZmZmZmZmIj48cGF0aCBkPSJNMzYuNTkgMTMuNjhjLTEuOTctMS45Ny02LjgyLTEuNTktMTAuMTcuODgtLjQ5LjM3LS45NX44MS0xLjM3IDEuMDQtMS44OS0xLjIyLTQtMi4yOC02LjE4LTIuMjgtMi44NCAwLTUuNDIuNDYtNy40MSAxLjM3LTIgMS8.LTMgMzcuNjkgMTAuNzVDMzQgNy45IDM1LjMyIDQuOTMgMzYuNTkgMiA4LjUzIDUgMyA2LjQgMyAxMC43NSAyMyAxNSAzMi41IDI1LjcgMTkgYyAxIDguNTcgNi40MiAyLjc4IDkuMzUgMS4wNCAyLjU5LjIgNC4zNSAyLjA1IDQuMzUgNC41OFYzNC41N0M1MCAzOS43MSA0My4zNCA0NCAzNCA0NGMtOC41NSAwLTE1LjUtNC4yOC0xNS41LTEyUyI+PC9wYXRoPjwvc3ZnPg==')_20_20,auto] border-white/10 bg-white/8 text-white"
              )}
            >
              <div className="mb-2 flex items-center gap-2">
                <span className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wide text-white/70">
                  {m.role === "human" ? (
                    <>
                      <User className="h-3.5 w-3.5 opacity-80" /> You
                    </>
                  ) : m.role === "ai" ? (
                    <>
                      <Sparkles className="h-3.5 w-3.5 text-amber-300" /> AugustuS
                    </>
                  ) : (
                    m.role
                  )}
                </span>
                {m.role === "ai" && m.tool_name ? (
                  <ToolBadge tool={m.tool_name ?? undefined} />
                ) : null}
              </div>
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-white/90">
                {m.content}
              </div>
              {m.createdAt ? (
                <div className="mt-3 text-[10px] uppercase tracking-wider text-white/40">
                  {new Date(m.createdAt).toLocaleTimeString()}
                </div>
              ) : null}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
