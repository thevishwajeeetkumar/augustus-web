import { NextResponse, type NextRequest } from "next/server";

const TOKEN_COOKIE = "augustus_token";

// Paths under /app require auth.
const PROTECTED_PREFIX = "/app/";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Skip _next, static files, and API routes
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api")
  ) {
    return NextResponse.next();
  }

  // Only guard /app/*
  if (!pathname.startsWith(PROTECTED_PREFIX)) {
    return NextResponse.next();
  }

  // Require JWT cookie
  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  if (!token) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/sign-in";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Limit matcher to everything (default), we filter inside
export const config = {
  matcher: ["/((?!.*\\.).*)"], // all paths without a dot (no assets)
};
