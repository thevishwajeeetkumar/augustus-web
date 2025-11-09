import { NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_BASE!;
const TOKEN_COOKIE = "augustus_token";

type TokenResponse = {
  access_token: string;
  token_type?: string;
  scopes?: string[] | string;
  exp?: number; // epoch seconds (optional)
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

    // FastAPI's /token expects x-www-form-urlencoded
    const body = new URLSearchParams();
    body.set("username", username);
    body.set("password", password);

    const res = await fetch(`${BACKEND}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      // Do not forward cookies here; login starts a session
    });

    const data = await res.json();

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

    // Derive cookie expiration if backend provided exp (epoch seconds)
    let expires: Date | undefined = undefined;
    if (typeof tokenData.exp === "number" && tokenData.exp > 0) {
      expires = new Date(tokenData.exp * 1000);
    }

    const response = NextResponse.json(
      {
        ok: true,
        token_type: tokenData.token_type ?? "bearer",
        scopes: tokenData.scopes ?? [],
        exp: tokenData.exp ?? null,
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
    return NextResponse.json(
      { error: "Login failed. Please try again.", err },
      { status: 500 }
    );
  }
}
