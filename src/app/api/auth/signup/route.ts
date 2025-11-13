import { NextResponse } from "next/server";
import { API_BASE } from "@/lib/config";

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

    const res = await fetch(`${API_BASE}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
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
        { error: data?.detail ?? "Sign-up failed." },
        { status: res.status }
      );
    }

    // Do NOT auto-login here; keep flows explicit.
    return NextResponse.json({ ok: true, user: data }, { status: 200 });
  } catch (err) {
    console.error("Signup route error:", err);
    return NextResponse.json(
      { error: "Sign-up failed. Please try again." },
      { status: 500 }
    );
  }
}
