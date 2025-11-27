"use client";

import * as React from "react";
import { MessageList, type ChatMessage } from "./MessageList";
import { MessageComposer } from "./MessageComposer";
import { cn } from "@/lib/utils";
import { useAuth } from "@/app/hooks/useAuth";
import { chatVideo, chatGeneral } from "@/lib/api";
import type { ConversationResponse, VideoChatRequest } from "@/lib/types";
import { saveConversation, updateConversation } from "@/lib/storage";

type Props = {
  conversationId?: string | null; // Optional now - can be null for new conversations
  videoId?: string | null; // For new conversations
  videoUrl?: string | null; // Alternative to videoId
  videoTitle?: string;
  isGeneral?: boolean; // true for General tab
  initialMessages?: ChatMessage[];
  initialQuery?: string | null; // Auto-send this query on mount if no conversationId
  onConversationCreated?: (conversationId: string, response: ConversationResponse) => void;
  onMessageSent?: (response: ConversationResponse) => void; // Pass response for updates
};

export function ChatPanel({ 
  conversationId: initialConversationId,
  videoId,
  videoUrl,
  videoTitle,
  isGeneral = false,
  initialMessages = [],
  initialQuery,
  onConversationCreated,
  onMessageSent,
}: Props) {
  const { signOut } = useAuth();
  const [messages, setMessages] = React.useState<ChatMessage[]>(initialMessages);
  const [conversationId, setConversationId] = React.useState<string | null>(initialConversationId || null);
  const [currentVideoTitle, setCurrentVideoTitle] = React.useState(videoTitle || "");
  const [currentVideoId, setCurrentVideoId] = React.useState(videoId || "");
  const [busy, setBusy] = React.useState(false);
  const [processingVideo, setProcessingVideo] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [hasAutoSent, setHasAutoSent] = React.useState(false);
  const lastAutoSentQuery = React.useRef<string | null>(null);

  // Sync initialMessages when they change - important for loading conversation history
  React.useEffect(() => {
    // Always sync when initialMessages changes (parent is loading conversation)
    if (initialMessages) {
      console.log("ChatPanel: Updating messages from initialMessages:", initialMessages.length);
      setMessages(initialMessages);
    }
  }, [initialMessages]);

  // Sync conversationId prop
  React.useEffect(() => {
    if (initialConversationId) {
      setConversationId(initialConversationId);
      // Reset auto-send flag when conversation changes
      if (initialConversationId !== conversationId) {
        setHasAutoSent(false);
        lastAutoSentQuery.current = null;
      }
    }
  }, [initialConversationId, conversationId]);

  // Auto-send initial query if provided and no conversation exists
  // Only send once per unique query to prevent duplicate calls
  React.useEffect(() => {
    if (
      initialQuery && 
      !conversationId && 
      !hasAutoSent && 
      !busy && 
      !processingVideo &&
      lastAutoSentQuery.current !== initialQuery // Prevent duplicate sends of same query
    ) {
      console.log("ChatPanel: Auto-sending initial query:", initialQuery);
      setHasAutoSent(true);
      lastAutoSentQuery.current = initialQuery;
      
      // Use setTimeout to avoid calling during render
      const timeoutId = setTimeout(() => {
        void sendToAgent(initialQuery);
      }, 100); // Small delay to ensure component is fully mounted
      
      // Cleanup timeout if component unmounts
      return () => {
        clearTimeout(timeoutId);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialQuery, conversationId, hasAutoSent, busy, processingVideo]);

  async function sendToAgent(prompt: string) {
    setError(null);
    
    // Optimistic UI update
    const tempUserMsg: ChatMessage = {
      id: `temp_${Date.now()}`,
      role: "human",
      content: prompt,
      createdAt: new Date().toISOString(),
    };
    setMessages((m) => [...m, tempUserMsg]);
    
    // Determine if this is first message (video processing)
    const isFirstMessage = !conversationId;
    if (isFirstMessage) {
      setProcessingVideo(true);
    } else {
      setBusy(true);
    }

    try {
      let response: ConversationResponse;

      if (isGeneral) {
        // Use General tab endpoint
        response = await chatGeneral({
          conversation_id: conversationId || undefined,
          query: prompt,
        });
      } else {
        // Use Video tab endpoint
        const request: VideoChatRequest = { query: prompt };
        
        if (conversationId) {
          request.conversation_id = conversationId;
        } else if (videoUrl) {
          request.video_url = videoUrl;
        } else if (videoId) {
          request.video_id = videoId;
        } else {
          throw new Error("Must provide conversation_id, video_url, or video_id");
        }

        response = await chatVideo(request);
      }

      // Store conversation_id if this was first message
      if (!conversationId && response.conversation_id) {
        setConversationId(response.conversation_id);
        
        // Update video info from response
        setCurrentVideoTitle(response.video_title);
        setCurrentVideoId(response.video_id);

        // Notify parent
        if (onConversationCreated) {
          onConversationCreated(response.conversation_id, response);
        }
      }

      // Convert ConversationResponse to ChatMessage format
      const userMsg: ChatMessage = {
        id: `user_${response.message_index - 1}`,
        role: "human",
        content: response.user_message,
        createdAt: response.created_at,
      };
      const aiMsg: ChatMessage = {
        id: `ai_${response.message_index}`,
        role: "ai",
        content: response.assistant_message,
        createdAt: response.created_at,
      };

      // Replace temporary message with real messages
      setMessages((m) => {
        const filtered = m.filter((msg) => msg.id !== tempUserMsg.id);
        return [...filtered, userMsg, aiMsg];
      });

      // Save/update conversation in localStorage
      if (response.conversation_id) {
        const storedConv = {
          conversation_id: response.conversation_id,
          video_id: response.video_id,
          video_title: response.video_title,
          last_message_at: response.created_at,
          message_count: response.message_index + 1, // +1 because index is 0-based
          last_user_message: response.user_message,
          last_assistant_message: response.assistant_message,
        };

        if (conversationId) {
          updateConversation(response.conversation_id, storedConv);
        } else {
          saveConversation(storedConv);
        }
      }

      // Notify parent
      if (onMessageSent) {
        onMessageSent(response);
      }
    } catch (err) {
      // Remove temporary message on error
      setMessages((m) => m.filter((msg) => msg.id !== tempUserMsg.id));

      const errorMsg = err instanceof Error ? err.message : "Network error. Please try again.";
      setError(errorMsg);

      // Handle specific error cases
      if (errorMsg.includes("401") || errorMsg.includes("Unauthorized")) {
        setMessages((m) => [
          ...m,
          {
            id: `e_${Date.now()}`,
            role: "ai",
            content: "⚠️ Session expired. Please sign in again.",
            createdAt: new Date().toISOString(),
          },
        ]);
        setTimeout(() => {
          signOut();
        }, 2000);
        return;
      }

      if (errorMsg.includes("404") && conversationId) {
        // Conversation not found - clear it and retry as new
        setConversationId(null);
        setError("Conversation not found. Starting new conversation...");
        // Could auto-retry here, but for now just show error
      }

      // Show error message
      setMessages((m) => [
        ...m,
        {
          id: `e_${Date.now()}`,
          role: "ai",
          content: `⚠️ ${errorMsg}`,
          createdAt: new Date().toISOString(),
        },
      ]);
    } finally {
      setBusy(false);
      setProcessingVideo(false);
    }
  }

  const displayTitle = currentVideoTitle || videoTitle || (isGeneral ? "General" : "New Chat");
  const displayVideoId = currentVideoId || videoId || (isGeneral ? "GENERAL" : "");

  return (
    <div className="relative flex h-full flex-col overflow-hidden rounded-3xl border border-white/12 bg-[#0b1120]/75 shadow-[0_26px_85px_rgba(12,18,45,0.55)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(95,139,255,0.18),transparent_55%),radial-gradient(circle_at_bottom,rgba(154,77,255,0.16),transparent_60%)]" />
      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-center justify-between border-b border-white/12 px-6 py-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.25em] text-white/45">
              {displayTitle}
            </p>
            {displayVideoId && (
              <div className="mt-1 flex items-center gap-2 text-sm text-white">
                <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/75">
                  {displayVideoId}
                </span>
              </div>
            )}
          </div>
          <div
            className={cn(
              "rounded-full border px-3 py-1 text-[11px] uppercase tracking-wide",
              processingVideo
                ? "border-blue-500/40 bg-blue-500/15 text-blue-200"
                : busy
                ? "border-amber-500/40 bg-amber-500/15 text-amber-200"
                : "border-emerald-500/35 bg-emerald-500/12 text-emerald-200"
            )}
          >
            {processingVideo ? "Processing video…" : busy ? "Thinking…" : "Ready"}
          </div>
        </div>
        <div className="flex h-full min-h-0 flex-col gap-4 px-5 py-5">
          <div className="flex-1 min-h-0 overflow-y-auto">
            <MessageList messages={messages} />
          </div>
          <div className="flex-shrink-0 space-y-3">
            <MessageComposer disabled={busy || processingVideo} onSend={sendToAgent} />
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
