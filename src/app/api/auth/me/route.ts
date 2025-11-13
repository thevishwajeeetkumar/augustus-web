import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { API_BASE } from "@/lib/config";

const TOKEN_COOKIE = "augustus_token";

/**
 * Proxies to backend GET /me endpoint to fetch current user info
 * Requires authentication + read scope
 */
export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(TOKEN_COOKIE)?.value;

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: missing token." },
        { status: 401 }
      );
    }

    const res = await fetch(`${API_BASE}/me`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
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
      // Backend uses {"detail": "message"} format
      const errorMsg = (data as { detail?: string })?.detail ?? "Failed to fetch user info.";
      return NextResponse.json(
        { error: errorMsg },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("Get user info error:", err);
    return NextResponse.json(
      { error: "Failed to fetch user info. Please try again." },
      { status: 500 }
    );
  }
}

