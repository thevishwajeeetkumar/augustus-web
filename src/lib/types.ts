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
  