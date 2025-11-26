// lib/types.ts
// Shared interfaces matching FastAPI schemas

export interface User {
    id: string;
    username: string;
    email: string;
    is_active: boolean;
    scopes?: string[];
    created_at?: string;
  }
  
  export interface TokenPayload {
    access_token: string;
    token_type: "bearer";
    exp?: number;
  }
  
  export interface Session {
    session_id: string;
    user_id: string;
    current_video_id: string | null;
    current_video_url: string | null;
    is_active: boolean;
    created_at: string;
    last_activity: string;
  }
  
  export interface Message {
    id: string;
    session_id: string;
    message_index: number;
    message_type: "human" | "ai" | "system" | "tool";
    content: string;
    tool_name?: string;
    tool_success?: boolean;
    created_at: string;
  }
  
  export interface AgentQueryRequest {
    query: string;
    url?: string;
    session_id?: string;
  }
  
  export interface AgentQueryResponse {
    answer: string;
    session_id: string;
    video_context?: string;
    tool_name?: string;
  }
  
  // Schema 2 types for video conversations
  export interface VideoConversation {
    conversation_id: string;
    user_id: string;
    video_id: string;
    video_url: string;
    video_title: string;
    created_at: string;
    last_message_at: string;
    message_count: number;
    last_user_message: string | null;
    last_assistant_message: string | null;
    is_pinned: boolean;
    synopsis_preview?: string | null;
  }

  export interface ConversationMessage {
    id: string;
    conversation_id: string;
    user_id: string;
    video_id: string;
    message_index: number;
    role: "user" | "assistant" | "system";
    content: string;
    content_length: number;
    tokens_estimate?: number | null;
    created_at: string;
  }

  // API request/response types for chat endpoints
  export interface CreateConversationRequest {
    videoUrl?: string;
    videoId?: string;
  }

  export interface CreateConversationResponse {
    conversation: VideoConversation;
  }

  export interface SendMessageRequest {
    content: string;
  }

  export interface SendMessageResponse {
    user_message: ConversationMessage;
    assistant_message: ConversationMessage;
    conversation: VideoConversation;
  }

  // V2 API types (backend_reference)
  /**
   * Response format from /api/v2/chat/video and /api/v2/chat/general
   * ⚠️ Always store conversation_id from response!
   */
  export interface ConversationResponse {
    conversation_id: string; // UUID - ⚠️ STORE THIS!
    video_id: string; // YouTube video ID (11 chars) or "GENERAL"
    video_title: string;
    user_message: string; // Direct string content
    assistant_message: string; // Direct string content
    message_index: number; // Sequential: 0, 1, 2, ...
    created_at: string; // ISO 8601
  }

  /**
   * Request format for /api/v2/chat/video
   */
  export interface VideoChatRequest {
    conversation_id?: string; // For existing conversations
    video_url?: string; // For new conversations
    video_id?: string; // Alternative to video_url
    query: string; // Required, max 2000 chars
  }

  /**
   * Request format for /api/v2/chat/general
   */
  export interface GeneralChatRequest {
    conversation_id?: string; // Optional for new
    query: string; // Required, max 2000 chars
  }

  /**
   * Stored conversation metadata for localStorage
   */
  export interface StoredConversation {
    conversation_id: string;
    video_id: string;
    video_title: string;
    last_message_at: string;
    message_count: number;
    last_user_message: string | null;
    last_assistant_message: string | null;
    is_pinned?: boolean;
  }
  