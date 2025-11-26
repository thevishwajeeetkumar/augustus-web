"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import type { StoredConversation } from "@/lib/types";
import { MessageSquare, Plus, Pin } from "lucide-react";

type Props = {
  conversations: StoredConversation[];
  selectedConversationId: string | null;
  onSelectConversation: (conversationId: string) => void;
  onNewChat: () => void;
  isLoading?: boolean;
};

function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function truncateText(text: string | null, maxLength: number): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
}

export function ConversationSidebar({
  conversations,
  selectedConversationId,
  onSelectConversation,
  onNewChat,
  isLoading = false,
}: Props) {
  return (
    <div className="flex h-full flex-col border-r border-white/10 bg-[#0a0f1e]/95 backdrop-blur">
      <div className="flex flex-col gap-2 border-b border-white/10 p-4">
        <button
          onClick={onNewChat}
          className={cn(
            "flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition-all hover:bg-white/10 hover:border-white/20",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
          )}
        >
          <Plus className="h-4 w-4" />
          <span>New chat</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center p-8 text-sm text-white/50">
            Loading conversations...
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-white/50">
            <MessageSquare className="mb-3 h-8 w-8 text-white/30" />
            <p className="text-sm">No conversations yet</p>
            <p className="mt-1 text-xs text-white/40">Start a new chat to begin</p>
          </div>
        ) : (
          <div className="p-2">
            {conversations.map((conv) => {
              const isSelected = conv.conversation_id === selectedConversationId;
              const preview = conv.last_user_message || conv.last_assistant_message || "";
              const truncatedPreview = truncateText(preview, 60);

              return (
                <button
                  key={conv.conversation_id}
                  onClick={() => onSelectConversation(conv.conversation_id)}
                  className={cn(
                    "group relative w-full rounded-lg border px-3 py-2.5 text-left transition-all",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30",
                    isSelected
                      ? "border-white/20 bg-white/10 shadow-sm"
                      : "border-transparent bg-transparent hover:border-white/10 hover:bg-white/5"
                  )}
                >
                  <div className="flex items-start gap-2">
                    {conv.is_pinned && (
                      <Pin className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-400/70" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3
                          className={cn(
                            "truncate text-sm font-medium",
                            isSelected ? "text-white" : "text-white/90"
                          )}
                        >
                          {truncateText(conv.video_title, 50)}
                        </h3>
                      </div>
                      {truncatedPreview && (
                        <p className="mt-1 line-clamp-1 text-xs text-white/60">
                          {truncatedPreview}
                        </p>
                      )}
                      <div className="mt-1.5 flex items-center gap-2 text-[10px] text-white/40">
                        <span>{formatRelativeTime(conv.last_message_at)}</span>
                        {conv.message_count > 0 && (
                          <>
                            <span>•</span>
                            <span>{conv.message_count} messages</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

