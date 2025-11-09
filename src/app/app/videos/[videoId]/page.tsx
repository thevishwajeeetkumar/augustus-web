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
    <div className="h-[calc(100vh-4rem)]"> {/* minus header height */}
      <h1 className="mb-3 text-xl font-semibold">Chat • {params.videoId}</h1>
      <div className="h-full">
        <ChatPanel initialSessionId={sid} videoId={params.videoId} />
      </div>
    </div>
  );
}
