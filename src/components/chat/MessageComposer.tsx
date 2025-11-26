"use client";

import * as React from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_QUERY_LENGTH = 2000;

type Props = {
  disabled?: boolean;
  onSend: (text: string) => Promise<void> | void;
};

export function MessageComposer({ disabled, onSend }: Props) {
  const [text, setText] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const charCount = text.length;
  const isOverLimit = charCount > MAX_QUERY_LENGTH;
  const remainingChars = MAX_QUERY_LENGTH - charCount;

  async function handleSend() {
    const value = text.trim();
    if (!value || disabled || busy) return;
    
    // Validate length
    if (value.length > MAX_QUERY_LENGTH) {
      return; // Don't send if over limit
    }
    
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
      <div className="mt-3 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-3">
          <span className="text-white/45">Shift + Enter for a new line</span>
          <span
            className={cn(
              "font-medium",
              isOverLimit
                ? "text-red-400"
                : remainingChars < 100
                ? "text-amber-400"
                : "text-white/45"
            )}
          >
            {charCount}/{MAX_QUERY_LENGTH}
          </span>
        </div>
        <Button
          onClick={() => void handleSend()}
          disabled={disabled || busy || isOverLimit || !text.trim()}
          className="flex-shrink-0"
        >
          {busy ? "Sending…" : "Send"}
        </Button>
      </div>
      {isOverLimit && (
        <div className="mt-2 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
          Query too long. Please reduce by {charCount - MAX_QUERY_LENGTH} characters.
        </div>
      )}
    </div>
  );
}
