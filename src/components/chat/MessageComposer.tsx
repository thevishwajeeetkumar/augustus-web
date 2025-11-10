"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type Props = {
  disabled?: boolean;
  onSend: (text: string) => Promise<void> | void;
};

export function MessageComposer({ disabled, onSend }: Props) {
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  async function handleSend() {
    const value = text.trim();
    if (!value || disabled || busy) return;
    setBusy(true);
    try {
      await onSend(value);
      setText("");
    } finally {
      setBusy(false);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  return (
    <div className="rounded-2xl border border-white/15 bg-white/6 p-4 shadow-[0_16px_45px_rgba(15,23,42,0.45)] backdrop-blur">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Ask a question… (Shift+Enter for newline)"
        disabled={disabled || busy}
        className="min-h-[96px] resize-none"
      />
      <div className="mt-3 flex items-center justify-between text-xs text-white/45">
        <span>Shift + Enter for a new line</span>
        <Button
          onClick={() => void handleSend()}
          disabled={disabled || busy}
        >
          {busy ? "Sending…" : "Send"}
        </Button>
      </div>
    </div>
  );
}
