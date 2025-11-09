import { NextResponse } from "next/server";

const BACKEND = process.env.NEXT_PUBLIC_API_BASE!;

export async function GET() {
  try {
    const res = await fetch(`${BACKEND}/health`, { method: "GET", cache: "no-store" });
    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: data?.detail ?? "Health check failed." },
        { status: res.status }
      );
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Health check failed. Backend unreachable.", err },
      { status: 502 }
    );
  }
}
