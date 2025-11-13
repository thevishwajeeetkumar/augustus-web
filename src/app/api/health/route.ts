import { NextResponse } from "next/server";
import { API_BASE } from "@/lib/config";

export async function GET() {
  try {
    const res = await fetch(`${API_BASE}/health`, { method: "GET", cache: "no-store" });
    
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
        { error: data?.detail ?? "Health check failed." },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("Health check error:", err);
    return NextResponse.json(
      { error: "Health check failed. Backend unreachable." },
      { status: 502 }
    );
  }
}
