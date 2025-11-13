import { NextResponse } from "next/server";
import { API_BASE } from "@/lib/config";

const TOKEN_COOKIE = "augustus_token";

type TokenResponse = {
  access_token: string;
  token_type?: string;
  scopes?: string[] | string;
  exp?: number; // epoch seconds (optional)
  expires_in?: number; // seconds (optional)
};

export async function POST(req: Request) {
  try {
    const { username, password } = await req.json();

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required." },
        { status: 400 }
      );
    }

    // Use /signin endpoint with JSON (consistent with backend API docs)
    const res = await fetch(`${API_BASE}/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    let data;
    try {
      data = await res.json();
    } catch (parseErr) {
      console.error("Failed to parse backend response:", parseErr);
      return NextResponse.json(
        { error: "Invalid response from backend." },
        { status: 502 }
      );
    }

    if (!res.ok) {
      return NextResponse.json(
        { error: (data as { detail?: string })?.detail ?? "Invalid credentials." },
        { status: res.status }
      );
    }

    // Ensure data is an object and has the required properties
    if (typeof data !== "object" || data === null) {
      return NextResponse.json(
        { error: "Invalid response format from backend." },
        { status: 502 }
      );
    }

    const tokenData = data as TokenResponse;
    const token = tokenData?.access_token;
    if (!token) {
      return NextResponse.json(
        { error: "Token not returned by backend." },
        { status: 502 }
      );
    }

    // Derive cookie expiration from expires_in (seconds) or exp (epoch seconds)
    let expires: Date | undefined = undefined;
    if (typeof tokenData.expires_in === "number" && tokenData.expires_in > 0) {
      expires = new Date(Date.now() + tokenData.expires_in * 1000);
    } else if (typeof tokenData.exp === "number" && tokenData.exp > 0) {
      expires = new Date(tokenData.exp * 1000);
    }

    const response = NextResponse.json(
      {
        ok: true,
        token_type: tokenData.token_type ?? "bearer",
        scopes: tokenData.scopes ?? [],
        exp: tokenData.exp ?? null,
        expires_in: tokenData.expires_in ?? null,
      },
      { status: 200 }
    );

    response.cookies.set(TOKEN_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      ...(expires ? { expires } : {}),
    });

    return response;
  } catch (err) {
    console.error("Login route error:", err);
    return NextResponse.json(
      { error: "Login failed. Please try again." },
      { status: 500 }
    );
  }
}
