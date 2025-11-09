import { NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_BASE!;

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { username, email, password } = payload ?? {};

    if (!username || !email || !password) {
      return NextResponse.json(
        { error: "Username, email, and password are required." },
        { status: 400 }
      );
    }

    const res = await fetch(`${BACKEND}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.detail ?? "Sign-up failed." },
        { status: res.status }
      );
    }

    // Do NOT auto-login here; keep flows explicit.
    return NextResponse.json({ ok: true, user: data }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Sign-up failed. Please try again." , err},
      { status: 500 }
    );
  }
}
