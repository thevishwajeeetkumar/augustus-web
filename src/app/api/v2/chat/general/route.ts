import { NextResponse } from "next/server";
import { API_BASE } from "@/lib/config";
import type { GeneralChatRequest, ConversationResponse } from "@/lib/types";

const TOKEN_COOKIE = "augustus_token";
const MAX_QUERY_LENGTH = 2000;

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
 * POST /api/v2/chat/general
 * Cross-video query endpoint for General tab
 * Handles both new and existing general conversations
 */
export async function POST(req: Request) {
  try {
    // Parse request body
    let body: GeneralChatRequest;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid request body. Expected JSON." },
        { status: 400 }
      );
    }

    // Validate query
    if (!body.query || typeof body.query !== "string") {
      return NextResponse.json(
        { error: "Field `query` (string) is required." },
        { status: 400 }
      );
    }

    // Validate query length
    if (body.query.length > MAX_QUERY_LENGTH) {
      return NextResponse.json(
        { 
          error: `Query too long (${body.query.length}/${MAX_QUERY_LENGTH} characters). Maximum length is ${MAX_QUERY_LENGTH} characters.` 
        },
        { status: 400 }
      );
    }

    // Extract token from cookie
    const cookieHeader = req.headers.get("cookie") || "";
    const token = parseCookie(cookieHeader)[TOKEN_COOKIE];

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: missing token." },
        { status: 401 }
      );
    }

    // Validate API_BASE
    if (!API_BASE || API_BASE === "undefined") {
      console.error("API_BASE is not configured.");
      return NextResponse.json(
        { error: "Backend configuration error. Please contact support." },
        { status: 500 }
      );
    }

    try {
      new URL(API_BASE);
    } catch {
      console.error(`Invalid API_BASE URL format: ${API_BASE}`);
      return NextResponse.json(
        { error: "Backend URL configuration error." },
        { status: 500 }
      );
    }

    // Build request body for backend (only include defined fields)
    const backendBody: Record<string, unknown> = { query: body.query };
    if (body.conversation_id) backendBody.conversation_id = body.conversation_id;

    const backendUrl = `${API_BASE}/api/v2/chat/general`;

    // Forward request to backend
    const res = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(backendBody),
      credentials: "include",
    });

    // Handle error responses
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      const errorMsg = 
        (errorData as { detail?: string }).detail || 
        (errorData as { error?: string }).error || 
        `Request failed (status ${res.status})`;

      // Handle specific status codes per backend_reference
      if (res.status === 400) {
        return NextResponse.json(
          { error: errorMsg },
          { status: 400 }
        );
      } else if (res.status === 401) {
        return NextResponse.json(
          { error: "Unauthorized: invalid or expired token." },
          { status: 401 }
        );
      } else if (res.status === 403) {
        return NextResponse.json(
          { error: "Forbidden: missing 'write' scope." },
          { status: 403 }
        );
      } else if (res.status === 404) {
        return NextResponse.json(
          { error: errorMsg },
          { status: 404 }
        );
      } else if (res.status === 503) {
        return NextResponse.json(
          { error: "Service temporarily unavailable. Pinecone may not be configured." },
          { status: 503 }
        );
      } else if (res.status === 504) {
        return NextResponse.json(
          { error: "Request timed out. The query may be too complex. Please try again." },
          { status: 504 }
        );
      }

      return NextResponse.json(
        { error: errorMsg },
        { status: res.status }
      );
    }

    // Parse successful response
    const data = (await res.json()) as ConversationResponse;

    // Validate response structure
    if (!data.conversation_id || !data.video_id || !data.video_title) {
      console.error("Invalid response format from backend:", data);
      return NextResponse.json(
        { error: "Invalid response format from backend." },
        { status: 502 }
      );
    }

    // Verify video_id is "GENERAL" for general tab
    if (data.video_id !== "GENERAL") {
      console.warn(`Expected video_id to be "GENERAL" but got "${data.video_id}"`);
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("POST /api/v2/chat/general error:", err);
    const errorMsg = err instanceof Error ? err.message : "Failed to process request";
    
    // Handle network errors
    if (err instanceof TypeError && err.message.includes("fetch")) {
      return NextResponse.json(
        { error: `Cannot connect to backend server at ${API_BASE}. Please ensure the backend is running.` },
        { status: 502 }
      );
    }

    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}

