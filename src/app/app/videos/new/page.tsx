"use client";

import * as React from "react";
import { VideoUrlForm } from "@/components/video/VideoUrlForm";
import { IngestStatus } from "@/components/video/IngestStatus";

export default function NewVideoPage() {
  const [status, setStatus] = React.useState<"idle" | "processing" | "ready" | "error">("idle");

  // We mark "processing" when submit starts; VideoUrlForm will navigate on success.
  function handleBeforeSubmit() {
    setStatus("processing");
  }

  return (
    <div className="relative space-y-10">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-white/15 to-transparent" />
        <div className="absolute -top-32 right-[16%] h-[420px] w-[420px] bg-[radial-gradient(circle,rgba(95,139,255,0.26),transparent_72%)] blur-[120px]" />
        <div className="absolute bottom-[-30%] left-[10%] h-[360px] w-[360px] rounded-full bg-[radial-gradient(circle,rgba(122,93,255,0.2),transparent_72%)] blur-[115px]" />
      </div>
      <header className="relative z-10 space-y-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1 text-[11px] uppercase tracking-[0.25em] text-white/55">
          Ingest
        </span>
        <h1 className="text-4xl font-semibold">Analyze a video</h1>
        <p className="max-w-2xl text-sm text-white/65">
          AugustuS will retrieve transcripts, translate where needed, and structure the knowledge for question answering. Paste a link to get started.
        </p>
      </header>

      <div
        onClickCapture={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest("button[type='submit']")) handleBeforeSubmit();
        }}
        className="relative z-10"
      >
        <VideoUrlForm />
      </div>

      <div className="relative z-10 max-w-xl">
        <IngestStatus status={status} />
      </div>
    </div>
  );
}
