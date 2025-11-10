"use client";

import { useParams, useSearchParams } from "next/navigation";
import { ChatPanel } from "@/components/chat/ChatPanel";

/**
 * Backend can auto-resume the most recent active session if session_id is empty.
 * If you pass ?sid=<session_id> in the URL, we use that as initialSessionId.
 */
export default function VideoChatPage() {
  const params = useParams<{ videoId: string }>();
  const search = useSearchParams();
  const sid = search.get("sid") || "";

  return (
    <div className="relative flex h-[calc(100vh-4rem)] flex-col gap-6">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-white/15 to-transparent" />
        <div className="absolute -top-24 right-[20%] h-[420px] w-[420px] bg-[radial-gradient(circle,rgba(95,139,255,0.24),transparent_70%)] blur-[120px]" />
        <div className="absolute bottom-[-30%] left-[18%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(122,93,255,0.2),transparent_70%)] blur-[115px]" />
      </div>
      <header className="relative z-10 space-y-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-white/55">
          Conversation
        </span>
        <h1 className="text-3xl font-semibold">Chat · {params.videoId}</h1>
        <p className="max-w-2xl text-sm text-white/65">
          Ask AugustuS anything about this video. Sources, tools, and follow-ups stay attached to the active session.
        </p>
      </header>
      <div className="relative z-10 flex-1">
        <ChatPanel initialSessionId={sid} videoId={params.videoId} />
      </div>
    </div>
  );
}
