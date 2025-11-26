import { NextResponse } from "next/server";
import { API_BASE } from "@/lib/config";
import type { VideoConversation, CreateConversationRequest, CreateConversationResponse } from "@/lib/types";

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
 * GET /api/chat/conversations
 * Returns list of conversations for the current user (last 5 by default)
 */
export async function GET(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const token = parseCookie(cookieHeader)[TOKEN_COOKIE];

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: missing token." },
        { status: 401 }
      );
    }

    const backendUrl = `${API_BASE}/chat/conversations`;

    const res = await fetch(backendUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
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

    const conversations = (await res.json()) as VideoConversation[];
    return NextResponse.json(conversations, { status: 200 });
  } catch (err) {
    console.error("GET /api/chat/conversations error:", err);
    const errorMsg = err instanceof Error ? err.message : "Failed to fetch conversations";
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}

/**
 * POST /api/chat/conversations
 * Creates or returns existing conversation for a video
 * Body: { videoUrl?: string, videoId?: string }
 */
export async function POST(req: Request) {
  try {
    const cookieHeader = req.headers.get("cookie") || "";
    const token = parseCookie(cookieHeader)[TOKEN_COOKIE];

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: missing token." },
        { status: 401 }
      );
    }

    const body = (await req.json()) as CreateConversationRequest;
    const backendUrl = `${API_BASE}/chat/conversations`;

    const res = await fetch(backendUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(body),
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

    const response = (await res.json()) as CreateConversationResponse;
    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error("POST /api/chat/conversations error:", err);
    const errorMsg = err instanceof Error ? err.message : "Failed to create conversation";
    return NextResponse.json(
      { error: errorMsg },
      { status: 500 }
    );
  }
}

