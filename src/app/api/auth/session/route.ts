import { Buffer } from "node:buffer";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const TOKEN_COOKIE = "augustus_token";

type SessionPayload = {
  authenticated: boolean;
  user?: Record<string, unknown> | null;
};

function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/");
    const decoded =
      typeof window === "undefined"
        ? Buffer.from(payload, "base64").toString("utf8")
        : window.atob(payload);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_COOKIE)?.value;

    if (!token) {
      const response: SessionPayload = { authenticated: false, user: null };
      return NextResponse.json(response, { status: 200 });
    }

    const user = decodeJwt(token);
    const response: SessionPayload = {
      authenticated: true,
      user,
    };
    return NextResponse.json(response, { status: 200 });
  } catch (err) {
    console.error("Session route error:", err);
    return NextResponse.json(
      { error: "Failed to get session. Please try again." },
      { status: 500 }
    );
  }
}

