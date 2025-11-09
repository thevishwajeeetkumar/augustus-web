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
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder="Ask a question… (Shift+Enter for newline)"
        disabled={disabled || busy}
        className="min-h-[80px] resize-none text-sm text-white placeholder:text-white/40"
      />
      <div className="mt-2 flex items-center justify-end">
        <Button
          onClick={() => void handleSend()}
          disabled={disabled || busy}
          className="rounded-full text-gray-900"
        >
          {busy ? "Sending…" : "Send"}
        </Button>
      </div>
    </div>
  );
}
