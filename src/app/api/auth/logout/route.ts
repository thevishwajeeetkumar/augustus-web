import { NextResponse } from "next/server";

const TOKEN_COOKIE = "augustus_token";

export async function POST() {
  const res = NextResponse.json({ ok: true }, { status: 200 });

  // Clear cookie by setting expired
  res.cookies.set(TOKEN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: new Date(0),
  });

  return res;
}
