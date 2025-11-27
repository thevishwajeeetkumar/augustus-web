"use client";

import * as React from "react";
import { ConversationSidebar } from "@/components/chat/ConversationSidebar";
import { ChatPanel } from "@/components/chat/ChatPanel";
import { VideoUrlForm } from "@/components/video/VideoUrlForm";
import { GeneralForm } from "@/components/general/GeneralForm";
import { EmptyState } from "@/components/common/EmptyState";
import type { StoredConversation, ConversationResponse } from "@/lib/types";
import type { ChatMessage } from "@/components/chat/MessageList";
import { getStoredConversations, saveConversation, updateConversation } from "@/lib/storage";
import { fetchConversationMessages } from "@/lib/api";
import type { ConversationMessage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Video, Globe } from "lucide-react";

type ActiveTab = "video" | "general";

export default function QueryPage() {
  const [conversations, setConversations] = React.useState<StoredConversation[]>([]);
  const [activeTab, setActiveTab] = React.useState<ActiveTab>("video");
  
  // Separate conversation IDs for video and general tabs
  const [videoConversationId, setVideoConversationId] = React.useState<string | null>(null);
  const [generalConversationId, setGeneralConversationId] = React.useState<string | null>(null);
  
  // Message history (built from responses)
  const [videoMessages, setVideoMessages] = React.useState<ChatMessage[]>([]);
  const [generalMessages, setGeneralMessages] = React.useState<ChatMessage[]>([]);
  
  const [showNewChatForm, setShowNewChatForm] = React.useState(true); // Start with form shown for video tab
  const [newChatVideoUrl, setNewChatVideoUrl] = React.useState<string | null>(null);
  const [newChatVideoQuery, setNewChatVideoQuery] = React.useState<string | null>(null); // Query for video form
  const [newChatGeneralQuery, setNewChatGeneralQuery] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loadingMessages, setLoadingMessages] = React.useState(false);

  // Get current conversation ID based on active tab
  const currentConversationId = activeTab === "video" ? videoConversationId : generalConversationId;
  const currentMessages = activeTab === "video" ? videoMessages : generalMessages;
  const selectedConversation = conversations.find((c) => c.conversation_id === currentConversationId);

  // Helper function to convert ConversationMessage[] to ChatMessage[]
  function convertMessagesToChatMessages(messages: ConversationMessage[]): ChatMessage[] {
    return messages.map((msg) => ({
      id: msg.id,
      role: msg.role === "user" ? "human" : msg.role === "assistant" ? "ai" : msg.role,
      content: msg.content,
      createdAt: msg.created_at,
    }));
  }

  // Load conversations from localStorage on mount
  React.useEffect(() => {
    async function loadInitialConversation() {
      const stored = getStoredConversations();
      setConversations(stored);
      
      // If there are conversations, show the first one (prioritize video conversations)
      if (stored.length > 0) {
        const firstVideoConv = stored.find((c) => c.video_id !== "GENERAL");
        const firstGeneralConv = stored.find((c) => c.video_id === "GENERAL");
        
        if (firstVideoConv) {
          // Show first video conversation
          setVideoConversationId(firstVideoConv.conversation_id);
          setActiveTab("video");
          setShowNewChatForm(false);
          setLoadingMessages(true);
          
          // Load messages for the initial conversation
          try {
            console.log("Loading initial video conversation messages:", firstVideoConv.conversation_id);
            const messages = await fetchConversationMessages(firstVideoConv.conversation_id);
            console.log("Loaded initial messages:", messages.length);
            const chatMessages = convertMessagesToChatMessages(messages);
            setVideoMessages(chatMessages);
          } catch (err) {
            console.error("Error loading initial conversation messages:", err);
            setVideoMessages([]);
          } finally {
            setLoadingMessages(false);
          }
        } else if (firstGeneralConv) {
          // Show first general conversation if no video conversations
          setGeneralConversationId(firstGeneralConv.conversation_id);
          setActiveTab("general");
          setShowNewChatForm(false);
          setLoadingMessages(true);
          
          // Load messages for the initial conversation
          try {
            console.log("Loading initial general conversation messages:", firstGeneralConv.conversation_id);
            const messages = await fetchConversationMessages(firstGeneralConv.conversation_id);
            console.log("Loaded initial messages:", messages.length);
            const chatMessages = convertMessagesToChatMessages(messages);
            setGeneralMessages(chatMessages);
          } catch (err) {
            console.error("Error loading initial conversation messages:", err);
            setGeneralMessages([]);
          } finally {
            setLoadingMessages(false);
          }
        }
      }
    }
    
    void loadInitialConversation();
  }, []);

  async function handleSelectConversation(conversationId: string) {
    const conv = conversations.find((c) => c.conversation_id === conversationId);
    if (!conv) {
      console.warn("Conversation not found:", conversationId);
      return;
    }

    setNewChatVideoUrl(null);
    setNewChatVideoQuery(null);
    setNewChatGeneralQuery(null);
    setShowNewChatForm(false); // Hide form when selecting a conversation
    setError(null);
    setLoadingMessages(true);

    // First, switch to the conversation immediately (optimistic update)
    if (conv.video_id === "GENERAL") {
      setGeneralConversationId(conversationId);
      setActiveTab("general");
    } else {
      setVideoConversationId(conversationId);
      setActiveTab("video");
    }

    // Then fetch message history for the selected conversation
    try {
      console.log("Loading messages for conversation:", conversationId);
      const messages = await fetchConversationMessages(conversationId);
      console.log("Loaded messages:", messages.length);
      const chatMessages = convertMessagesToChatMessages(messages);
      console.log("Converted to chat messages:", chatMessages.length);

      if (conv.video_id === "GENERAL") {
        setGeneralMessages(chatMessages);
      } else {
        setVideoMessages(chatMessages);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : "Failed to load conversation";
      setError(errorMsg);
      console.error("Error loading conversation messages:", err);
      
      // Set empty messages on error, but keep conversation selected
      if (conv.video_id === "GENERAL") {
        setGeneralMessages([]);
      } else {
        setVideoMessages([]);
      }
    } finally {
      setLoadingMessages(false);
    }
  }

  function handleNewChatClick() {
    setShowNewChatForm(true);
    setNewChatVideoUrl(null);
    setNewChatVideoQuery(null);
    setNewChatGeneralQuery(null);
    if (activeTab === "video") {
      setVideoConversationId(null);
      setVideoMessages([]);
    } else {
      setGeneralConversationId(null);
      setGeneralMessages([]);
    }
  }

  function handleConversationCreated(conversationId: string, response: ConversationResponse) {
    // Update conversation ID for current tab
    if (activeTab === "video") {
      setVideoConversationId(conversationId);
      // Clear newChatVideoUrl and query since we now have a conversation
      setNewChatVideoUrl(null);
      setNewChatVideoQuery(null);
    } else {
      setGeneralConversationId(conversationId);
      // Clear newChatGeneralQuery since we now have a conversation
      setNewChatGeneralQuery(null);
    }

    // Save to localStorage
    const storedConv: StoredConversation = {
      conversation_id: response.conversation_id,
      video_id: response.video_id,
      video_title: response.video_title,
      last_message_at: response.created_at,
      message_count: response.message_index + 1,
      last_user_message: response.user_message,
      last_assistant_message: response.assistant_message,
    };
    saveConversation(storedConv);

    // Update conversations list
    setConversations(getStoredConversations());

    // Hide new chat form
    setShowNewChatForm(false);
  }

  function handleMessageSent(response: ConversationResponse) {
    // Convert response to ChatMessage format
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

    // Update messages for current tab
    if (activeTab === "video") {
      setVideoMessages((m) => [...m, userMsg, aiMsg]);
    } else {
      setGeneralMessages((m) => [...m, userMsg, aiMsg]);
    }

    // Update conversation in localStorage
    updateConversation(response.conversation_id, {
      last_message_at: response.created_at,
      message_count: response.message_index + 1,
      last_user_message: response.user_message,
      last_assistant_message: response.assistant_message,
    });

    // Refresh conversations list
    setConversations(getStoredConversations());
  }

  function handleVideoUrlFormSuccess(videoId: string, videoUrl: string, query?: string) {
    console.log("VideoUrlForm success:", { videoId, videoUrl, query });
    // Clear any existing conversation to start fresh
    setVideoConversationId(null);
    setVideoMessages([]);
    // Store video URL and query for ChatPanel to use
    const finalQuery = query || "Analyze this video";
    setNewChatVideoUrl(videoUrl);
    setNewChatVideoQuery(finalQuery);
    setShowNewChatForm(false);
    // Ensure we're on video tab
    setActiveTab("video");
    // ChatPanel will handle the actual conversation creation via V2 API and auto-send query
    console.log("State updated - should show ChatPanel now");
  }

  function handleGeneralFormSuccess(query: string) {
    // Store query for ChatPanel to use
    setNewChatGeneralQuery(query);
    setShowNewChatForm(false);
    // ChatPanel will handle the actual conversation creation via V2 API
  }

  function handleTabSwitch(tab: ActiveTab) {
    setActiveTab(tab);
    
    // When switching tabs, check if there's a conversation for that tab
    // If yes, show the conversation; if no, show the form
    if (tab === "video") {
      if (videoConversationId) {
        // Has conversation - show it
        setShowNewChatForm(false);
      } else {
        // No conversation - show form
        setShowNewChatForm(true);
        setNewChatVideoUrl(null);
        setNewChatVideoQuery(null);
        setVideoMessages([]);
      }
    } else {
      if (generalConversationId) {
        // Has conversation - show it
        setShowNewChatForm(false);
      } else {
        // No conversation - show form
        setShowNewChatForm(true);
        setNewChatGeneralQuery(null);
        setGeneralMessages([]);
      }
    }
  }

  // Filter conversations by tab
  const videoConversations = conversations.filter((c) => c.video_id !== "GENERAL");
  const generalConversations = conversations.filter((c) => c.video_id === "GENERAL");
  const displayConversations = activeTab === "video" ? videoConversations : generalConversations;

  // Determine what to show in content area
  // Priority: 
  // 1. If we have form data ready (newChatVideoUrl or newChatGeneralQuery), show ChatPanel
  // 2. If we have an active conversation, show ChatPanel
  // 3. Otherwise, show form if explicitly requested
  
  // Show chat panel when we have a conversation or form data ready (highest priority)
  const shouldShowChatPanel = 
    (activeTab === "video" && (videoConversationId || newChatVideoUrl)) ||
    (activeTab === "general" && (generalConversationId || newChatGeneralQuery));
  
  // Video tab: show form only if NOT showing chat panel AND form is explicitly shown
  const shouldShowVideoForm = activeTab === "video" && !shouldShowChatPanel && showNewChatForm;
  // General tab: show form only if NOT showing chat panel AND form is explicitly shown
  const shouldShowGeneralForm = activeTab === "general" && !shouldShowChatPanel && showNewChatForm;

  // Debug logging
  React.useEffect(() => {
    console.log("Display state:", {
      activeTab,
      showNewChatForm,
      videoConversationId,
      newChatVideoUrl,
      newChatVideoQuery,
      generalConversationId,
      newChatGeneralQuery,
      shouldShowVideoForm,
      shouldShowGeneralForm,
      shouldShowChatPanel,
    });
  }, [activeTab, showNewChatForm, videoConversationId, newChatVideoUrl, newChatVideoQuery, generalConversationId, newChatGeneralQuery, shouldShowVideoForm, shouldShowGeneralForm, shouldShowChatPanel]);

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-white/15 to-transparent" />
        <div className="absolute -top-28 left-1/2 h-[420px] w-[420px] -translate-x-1/2 bg-[radial-gradient(circle,rgba(95,139,255,0.24),transparent_70%)] blur-[120px]" />
        <div className="absolute bottom-[-30%] right-[16%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(122,93,255,0.2),transparent_70%)] blur-[110px]" />
      </div>
      
      <div className="relative z-10 flex h-full">
        {/* Sidebar */}
        <div className="w-80 flex-shrink-0">
          <ConversationSidebar
            conversations={displayConversations}
            selectedConversationId={currentConversationId}
            onSelectConversation={handleSelectConversation}
            onNewChat={handleNewChatClick}
            isLoading={false}
          />
        </div>

        {/* Main chat area */}
        <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
          {/* Tab Switcher */}
          <div className="flex items-center gap-2 border-b border-white/10 bg-[#0a0f1e]/95 px-6 py-3">
            <button
              onClick={() => handleTabSwitch("video")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                activeTab === "video"
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white/80"
              )}
            >
              <Video className="h-4 w-4" />
              <span>Video</span>
            </button>
            <button
              onClick={() => handleTabSwitch("general")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                activeTab === "general"
                  ? "bg-white/10 text-white"
                  : "text-white/60 hover:bg-white/5 hover:text-white/80"
              )}
            >
              <Globe className="h-4 w-4" />
              <span>General</span>
            </button>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-hidden">
            {shouldShowVideoForm ? (
              <div className="flex h-full flex-col items-center justify-center p-8">
                <div className="w-full max-w-2xl">
                  <div className="mb-6 text-center">
                    <h1 className="text-3xl font-semibold text-white">New Chat</h1>
                    <p className="mt-2 text-sm text-white/65">
                      Start a conversation about a YouTube video
                    </p>
                  </div>
                  <VideoUrlForm
                    initialQuery=""
                    onSuccess={handleVideoUrlFormSuccess}
                  />
                  {error && (
                    <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {error}
                    </div>
                  )}
                </div>
              </div>
            ) : shouldShowGeneralForm ? (
              <div className="flex h-full flex-col items-center justify-center p-8">
                <div className="w-full max-w-2xl">
                  <div className="mb-6 text-center">
                    <h1 className="text-3xl font-semibold text-white">New Chat</h1>
                    <p className="mt-2 text-sm text-white/65">
                      Ask questions across all your videos
                    </p>
                  </div>
                  <GeneralForm
                    initialQuery=""
                    onSuccess={handleGeneralFormSuccess}
                  />
                  {error && (
                    <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                      {error}
                    </div>
                  )}
                </div>
              </div>
            ) : shouldShowChatPanel ? (
              <div className="flex h-full flex-col p-6">
                {loadingMessages ? (
                  <div className="flex h-full items-center justify-center">
                    <div className="text-center">
                      <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-white/20 border-t-white/60" />
                      <p className="text-sm text-white/60">Loading conversation...</p>
                    </div>
                  </div>
                ) : (
                  <ChatPanel
                    conversationId={currentConversationId}
                    videoId={activeTab === "video" && newChatVideoUrl ? undefined : (selectedConversation?.video_id || undefined)}
                    videoUrl={activeTab === "video" && newChatVideoUrl ? newChatVideoUrl : undefined}
                    videoTitle={selectedConversation?.video_title}
                    isGeneral={activeTab === "general"}
                    initialMessages={currentMessages}
                    initialQuery={
                      activeTab === "general" && newChatGeneralQuery 
                        ? newChatGeneralQuery 
                        : activeTab === "video" && newChatVideoQuery 
                        ? newChatVideoQuery 
                        : null
                    }
                    onConversationCreated={handleConversationCreated}
                    onMessageSent={handleMessageSent}
                  />
                )}
                {error && (
                  <div className="mt-4 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                    {error}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex h-full items-center justify-center">
                <EmptyState
                  title="No conversation selected"
                  description="Select a conversation from the sidebar or start a new chat"
                />
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
