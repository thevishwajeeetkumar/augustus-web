"use client";

import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  status: "idle" | "processing" | "ready" | "error";
  message?: string;
};

export function IngestStatus({ status, message }: Props) {
  const text =
    status === "processing"
      ? "Fetching transcript, translating, chunking, and embedding…"
      : status === "ready"
      ? "Ready!"
      : status === "error"
      ? message || "Something went wrong."
      : "Paste a YouTube link to get started.";

  const tone =
    status === "ready"
      ? "border-emerald-400/40 bg-emerald-500/10 text-emerald-200"
      : status === "error"
      ? "border-red-400/40 bg-red-500/10 text-red-200"
      : status === "processing"
      ? "border-indigo-400/30 bg-indigo-500/10 text-indigo-200"
      : "border-white/10 bg-white/5 text-white/70";

  return (
    <Card className={`border ${tone} backdrop-blur`}>
      <CardContent className="flex items-center justify-between gap-4 p-4 text-sm">
        <span>{text}</span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] uppercase tracking-[0.2em]">
          {status === "idle" ? "Idle" : status === "processing" ? "Working" : status === "ready" ? "Ready" : "Error"}
        </span>
      </CardContent>
    </Card>
  );
}
