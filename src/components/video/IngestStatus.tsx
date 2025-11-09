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

  return (
    <Card className="border-white/10 bg-white/5">
      <CardContent className="p-4 text-sm text-white/80">{text}</CardContent>
    </Card>
  );
}
