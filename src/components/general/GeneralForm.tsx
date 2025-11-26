"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MAX_QUERY_LENGTH = 2000;

type Props = {
  /** Optional: override default initial query */
  initialQuery?: string;
  /** Custom success handler - passes the query to parent */
  onSuccess?: (query: string) => void;
};

export function GeneralForm({ initialQuery = "", onSuccess }: Props) {
  const [query, setQuery] = React.useState(initialQuery);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [submitted, setSubmitted] = React.useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    
    // Prevent double submission
    if (submitted || loading) {
      return;
    }
    
    setError(null);
    setLoading(true);
    setSubmitted(true);

    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setError("Please enter a question to start the conversation.");
      setLoading(false);
      setSubmitted(false);
      return;
    }

    if (trimmedQuery.length > MAX_QUERY_LENGTH) {
      setError(`Query is too long. Maximum ${MAX_QUERY_LENGTH} characters allowed.`);
      setLoading(false);
      setSubmitted(false);
      return;
    }

    // Pass query to parent - ChatPanel will handle the actual API call via V2
    if (onSuccess) {
      onSuccess(trimmedQuery);
    }
    
    setLoading(false);
  }

  const charCount = query.length;
  const isOverLimit = charCount > MAX_QUERY_LENGTH;
  const isApproachingLimit = charCount > MAX_QUERY_LENGTH * 0.9;

  return (
    <form
      onSubmit={onSubmit}
      className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b1120]/70 p-6 shadow-[0_20px_65px_rgba(15,23,42,0.6)] backdrop-blur"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(95,139,255,0.15),transparent_60%)]" />
      <div className="relative z-10 space-y-5">
        <div>
          <Label htmlFor="generalQuery" className="text-xs uppercase tracking-[0.2em] text-white/60">
            Your Question
          </Label>
          <Textarea
            id="generalQuery"
            name="generalQuery"
            placeholder="Ask a question across all your videos..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={loading}
            required
            className="mt-2 min-h-32 resize-none border-white/10 bg-[#101a32]/70 text-sm text-white placeholder:text-white/40 focus-visible:border-white/40"
            maxLength={MAX_QUERY_LENGTH + 100} // Allow typing past limit for better UX
          />
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-white/40">
              Ask questions that span across multiple videos in your catalog.
            </p>
            <span
              className={cn(
                "text-xs font-medium",
                isOverLimit
                  ? "text-red-400"
                  : isApproachingLimit
                    ? "text-amber-400"
                    : "text-white/50"
              )}
            >
              {charCount}/{MAX_QUERY_LENGTH}
            </span>
          </div>
        </div>

        {error ? (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200" role="alert">
            {error}
          </div>
        ) : (
          <p className="text-xs text-white/50">
            Start a general conversation that can reference information from all videos you&apos;ve analyzed. The AI will search across your entire video catalog to answer your question.
          </p>
        )}

        {isOverLimit && (
          <div className="rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            Query too long. Please reduce by {charCount - MAX_QUERY_LENGTH} characters.
          </div>
        )}

        <Button
          type="submit"
          className="w-full rounded-full bg-linear-to-br from-[#5f8bff] via-[#7c5dff] to-[#9a4dff] py-2.5 text-white shadow-[0_18px_45px_rgba(100,149,255,0.45)] hover:-translate-y-0.5 transition disabled:opacity-50"
          disabled={loading || isOverLimit || !query.trim()}
        >
          {loading ? "Starting…" : "Start Conversation"}
        </Button>
      </div>
    </form>
  );
}

