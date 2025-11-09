import { NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_BASE!;
const TOKEN_COOKIE = "augustus_token";

/**
 * Proxies chat/ingest queries to FastAPI POST /
 * Expected body:
 *  - { query: string, url?: string, session_id?: string }
 * Returns backend JSON { answer, session_id, video_context? } as-is.
 */
export async function POST(req: Request) {
  try {
    const incoming = await req.json();
    const { query, url, session_id } = incoming ?? {};

    if (!query || (typeof query !== "string")) {
      return NextResponse.json(
        { error: "Field `query` (string) is required." },
        { status: 400 }
      );
    }

    // Read JWT from httpOnly cookie (sent by browser to this route)
    // In a route handler, cookies are not directly on the Request object; we rely on the headers.
    // Next.js forwards cookies automatically; we must extract token manually if needed.
    const cookieHeader = req.headers.get("cookie") || "";
    const token = parseCookie(cookieHeader)[TOKEN_COOKIE];

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: missing token." },
        { status: 401 }
      );
    }

    const res = await fetch(`${BACKEND}/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ query, url, session_id }),
    });

    // Try to read backend payload; if not JSON, fallback to text
    const text = await res.text();
    const payload = safeJson(text);

    if (!res.ok) {
      return NextResponse.json(
        { error: payload?.detail ?? payload ?? "Agent query failed." },
        { status: res.status }
      );
    }

    return NextResponse.json(payload, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Agent query failed. Please try again." , err},
      { status: 500 }
    );
  }
}

function parseCookie(header: string): Record<string, string> {
  return header.split(";").reduce((acc, part) => {
    const [k, ...v] = part.trim().split("=");
    if (!k) return acc;
    acc[decodeURIComponent(k)] = decodeURIComponent(v.join("=") || "");
    return acc;
  }, {} as Record<string, string>);
}

function safeJson(maybeJson: string) {
  try {
    return JSON.parse(maybeJson);
  } catch {
    return { raw: maybeJson };
  }
}
