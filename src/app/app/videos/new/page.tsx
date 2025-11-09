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
    <div className="space-y-6">
      <h1 className="text-xl font-semibold">Analyze a video</h1>
      {/* Wrap the form to intercept submit start */}
      <div
        onClickCapture={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest("button[type='submit']")) handleBeforeSubmit();
        }}
      >
        <VideoUrlForm />
      </div>
      <IngestStatus status={status} />
    </div>
  );
}
