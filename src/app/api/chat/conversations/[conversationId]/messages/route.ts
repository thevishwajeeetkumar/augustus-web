import { NextResponse } from "next/server";
import { API_BASE } from "@/lib/config";
import type { ConversationMessage, SendMessageRequest, SendMessageResponse } from "@/lib/types";

const TOKEN_COOKIE = "augustus_token";

function parseCookie(header: string): Record<string, string> {
  return header.split(";").reduce((acc, part) => {
    const [k, ...v] = part.trim().split("=");
    if (!k) return acc;
    try {
      const decodedKey = decodeURIComponent(k);
      const decodedValue = decodeURIComponent(v.join("=") || "");
      acc[decodedKey] = decodedValue;
    } catch {
      console.warn(`Skipping malformed cookie: ${k.substring(0, 20)}...`);
    }
    return acc;
  }, {} as Record<string, string>);
}

/**
 * GET /api/chat/conversations/[conversationId]/messages
 * Returns ordered messages for a conversation
 * 
 * Note: This endpoint requires the backend to implement:
 * GET /chat/conversations/{conversationId}/messages
 * 
 * If the backend doesn't have this endpoint yet, it will return 404.
 * The frontend handles this gracefully by showing an empty conversation.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    console.log(`[GET /api/chat/conversations/${conversationId}/messages] Fetching messages...`);
    
    const cookieHeader = req.headers.get("cookie") || "";
    const token = parseCookie(cookieHeader)[TOKEN_COOKIE];

    if (!token) {
      console.warn(`[GET /api/chat/conversations/${conversationId}/messages] Missing token`);
      return NextResponse.json(
        { error: "Unauthorized: missing token." },
        { status: 401 }
      );
    }

    // Try the backend endpoint
    const backendUrl = `${API_BASE}/chat/conversations/${conversationId}/messages`;
    console.log(`[GET /api/chat/conversations/${conversationId}/messages] Backend URL: ${backendUrl}`);

    const res = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      credentials: "include",
    });

    console.log(`[GET /api/chat/conversations/${conversationId}/messages] Backend response: ${res.status} ${res.statusText}`);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const errorMsg = (data as { detail?: string; error?: string }).detail || 
                      (data as { detail?: string; error?: string }).error || 
                      `Request failed (status ${res.status})`;
      
      // Log specific error codes with detailed messages
      if (res.status === 404) {
        console.warn(`[GET /api/chat/conversations/${conversationId}/messages] Backend endpoint not found (404). The backend needs to implement: GET /chat/conversations/{conversationId}/messages`);
      } else if (res.status === 403) {
        console.error(
          `[GET /api/chat/conversations/${conversationId}/messages] Forbidden (403). ` +
          `This usually means:\n` +
          `1. User doesn't own the conversation\n` +
          `2. User doesn't have 'read' scope in token\n` +
          `3. Backend authorization check is failing\n` +
          `Error from backend: ${errorMsg}`
        );
      } else if (res.status === 401) {
        console.error(`[GET /api/chat/conversations/${conversationId}/messages] Unauthorized (401). Token might be invalid or expired.`);
      }
      
      return NextResponse.json(
        { error: errorMsg },
        { status: res.status }
      );
    }

    const messages = (await res.json()) as ConversationMessage[];
    console.log(`[GET /api/chat/conversations/${conversationId}/messages] Success: ${messages.length} messages`);
    return NextResponse.json(messages, { status: 200 });
  } catch (err) {
    console.error(`[GET /api/chat/conversations/[id]/messages] Error:`, err);
    const errorMsg = err instanceof Error ? err.message : "Failed to fetch messages";
    
    // Check if it's a network error (backend not running)
    if (err instanceof TypeError && err.message.includes("fetch")) {
      console.error(`[GET /api/chat/conversations/[id]/messages] Cannot connect to backend at ${API_BASE}`);
      return NextResponse.json(
        { error: `Cannot connect to backend server. Please ensure the backend is running at ${API_BASE}` },
        { status: 502 }
      );
    }
    
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/conversations/[conversationId]/messages
 * Sends a message and triggers Q&A pipeline, returns user + assistant messages
 * Body: { content: string }
 */
export async function POST(
  req: Request,
  { params }: { params: Promise<{ conversationId: string }> }
) {
  try {
    const { conversationId } = await params;
    const cookieHeader = req.headers.get("cookie") || "";
    const token = parseCookie(cookieHeader)[TOKEN_COOKIE];

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: missing token." },
        { status: 401 }
      );
    }

    const body = (await req.json()) as SendMessageRequest;
    if (!body.content || typeof body.content !== "string") {
      return NextResponse.json(
        { error: "Field `content` (string) is required." },
        { status: 400 }
      );
    }

    const backendUrl = `${API_BASE}/chat/conversations/${conversationId}/query`;

    const res = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query: body.content }),
      credentials: "include",
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const errorMsg = (data as { detail?: string; error?: string }).detail || 
                      (data as { detail?: string; error?: string }).error || 
                      `Request failed (status ${res.status})`;
      return NextResponse.json(
        { error: errorMsg },
        { status: res.status }
      );
    }

    const response = (await res.json()) as SendMessageResponse;
    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error("POST /api/chat/conversations/[id]/messages error:", err);
    const errorMsg = err instanceof Error ? err.message : "Failed to send message";
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}

