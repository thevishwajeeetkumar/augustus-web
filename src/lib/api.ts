// lib/api.ts
// Generic fetch wrappers for backend endpoints

import { apiUrl } from "./config";
import type {
  AgentQueryRequest,
  AgentQueryResponse,
  TokenPayload,
  User,
  VideoChatRequest,
  GeneralChatRequest,
  ConversationResponse,
  ConversationMessage,
} from "./types";

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as { error?: string }).error || res.statusText;
    throw new Error(msg);
  }
  return data as T;
}

/** POST /token (login) */
export async function loginUser(username: string, password: string) {
  const res = await fetch(apiUrl("/token"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
    credentials: "include",
  });
  return handleResponse<TokenPayload>(res);
}

/** POST /signup (register) */
export async function registerUser(username: string, email: string, password: string) {
  const res = await fetch(apiUrl("/signup"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
    credentials: "include",
  });
  return handleResponse<{ ok: true; user: User }>(res);
}

/** POST /logout */
export async function logoutUser() {
  const res = await fetch(apiUrl("/logout"), {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Logout failed");
  return true;
}

/** POST / (agent query) */
export async function queryAgent(req: AgentQueryRequest) {
  const res = await fetch(apiUrl("/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(req),
  });
  return handleResponse<AgentQueryResponse>(res);
}

/** GET /health */
export async function fetchHealth() {
  const res = await fetch(apiUrl("/health"), { cache: "no-store" });
  return handleResponse<unknown | string>(res);
}

// V2 Chat API helpers (use Next.js API routes, not direct backend calls)

/**
 * POST /api/v2/chat/video
 * Per-video conversation endpoint
 * Handles both new and existing conversations
 */
export async function chatVideo(req: VideoChatRequest): Promise<ConversationResponse> {
  // Validate query length before sending
  const MAX_QUERY_LENGTH = 2000;
  if (req.query.length > MAX_QUERY_LENGTH) {
    throw new Error(`Query too long (${req.query.length}/${MAX_QUERY_LENGTH} characters)`);
  }

  const res = await fetch("/api/v2/chat/video", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMsg = 
      (errorData as { error?: string }).error || 
      (errorData as { detail?: string }).detail || 
      `Request failed (status ${res.status})`;
    throw new Error(errorMsg);
  }

  return handleResponse<ConversationResponse>(res);
}

/**
 * POST /api/v2/chat/general
 * Cross-video query endpoint for General tab
 * Handles both new and existing general conversations
 */
export async function chatGeneral(req: GeneralChatRequest): Promise<ConversationResponse> {
  // Validate query length before sending
  const MAX_QUERY_LENGTH = 2000;
  if (req.query.length > MAX_QUERY_LENGTH) {
    throw new Error(`Query too long (${req.query.length}/${MAX_QUERY_LENGTH} characters)`);
  }

  const res = await fetch("/api/v2/chat/general", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    const errorMsg = 
      (errorData as { error?: string }).error || 
      (errorData as { detail?: string }).detail || 
      `Request failed (status ${res.status})`;
    throw new Error(errorMsg);
  }

  return handleResponse<ConversationResponse>(res);
}

/**
 * GET /api/chat/conversations/[conversationId]/messages
 * Fetches all messages for a conversation
 * Returns empty array if conversation not found or has no messages (404)
 * 
 * Note: This requires the backend to implement:
 * GET /chat/conversations/{conversationId}/messages
 * 
 * If the backend endpoint doesn't exist (404), this gracefully returns an empty array.
 * The conversation will still work, but message history won't be loaded until the backend implements this endpoint.
 */
export async function fetchConversationMessages(conversationId: string): Promise<ConversationMessage[]> {
  try {
    const res = await fetch(`/api/chat/conversations/${conversationId}/messages`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
    });

    if (!res.ok) {
      // Handle 404 gracefully - backend endpoint might not exist yet
      if (res.status === 404) {
        console.info(
          `[fetchConversationMessages] Backend endpoint not found (404) for conversation ${conversationId}. ` +
          `This is expected if the backend hasn't implemented GET /chat/conversations/{id}/messages yet. ` +
          `Returning empty array - conversation will work but without message history.`
        );
        return [];
      }

      // For other errors, try to get error message
      const errorData = await res.json().catch(() => ({}));
      const errorMsg = 
        (errorData as { error?: string }).error || 
        (errorData as { detail?: string }).detail || 
        `Request failed (status ${res.status})`;
      
      // Handle 403 - user might not own conversation or missing scope
      if (res.status === 403) {
        console.warn(
          `[fetchConversationMessages] Forbidden (403) for conversation ${conversationId}. ` +
          `This usually means the user doesn't own the conversation or is missing 'read' scope. ` +
          `Error: ${errorMsg}. Returning empty array.`
        );
        return [];
      }
      
      // Handle 401 - authentication error
      if (res.status === 401) {
        console.warn("[fetchConversationMessages] Unauthorized (401). Token might be invalid or expired. Returning empty array.");
        return [];
      }
      
      // Throw for other server errors (500, 502, etc.)
      console.error(`[fetchConversationMessages] Server error (${res.status}):`, errorMsg);
      throw new Error(errorMsg);
    }

    const messages = await handleResponse<ConversationMessage[]>(res);
    console.log(`[fetchConversationMessages] Successfully loaded ${messages.length} messages for conversation ${conversationId}`);
    return messages;
  } catch (err) {
    // Handle network errors
    if (err instanceof TypeError && err.message.includes("fetch")) {
      console.warn("[fetchConversationMessages] Network error - backend might not be running. Returning empty array.");
      return [];
    }
    
    // Re-throw other errors
    throw err;
  }
}
