"use client";

import * as React from "react";

export type IngestStatus = "idle" | "processing" | "ready" | "error";

export type FetchStatus = () => Promise<
  { status: Exclude<IngestStatus, "idle">; message?: string } | IngestStatus
>;

type Options = {
  /** Polling interval in ms (default 1500ms) */
  intervalMs?: number;
  /** Optional timeout in ms to auto-stop and mark as error */
  timeoutMs?: number;
  /** Start immediately on mount (default false) */
  immediate?: boolean;
  /** Initial status (default "idle") */
  initialStatus?: IngestStatus;
};

/**
 * Polls an async fetcher for ingest status until it reaches "ready" or "error".
 * Returns control functions to start/stop, plus current status & message.
 */
export function useIngestPoll(fetchStatus: FetchStatus, opts: Options = {}) {
  const {
    intervalMs = 1500,
    timeoutMs,
    immediate = false,
    initialStatus = "idle",
  } = opts;

  const [status, setStatus] = React.useState<IngestStatus>(initialStatus);
  const [message, setMessage] = React.useState<string | undefined>(undefined);
  const [error, setError] = React.useState<string | null>(null);
  const [running, setRunning] = React.useState<boolean>(false);

  const intervalRef = React.useRef<number | null>(null);
  const timeoutRef = React.useRef<number | null>(null);
  const mountedRef = React.useRef<boolean>(false);

  const stop = React.useCallback(() => {
    if (intervalRef.current != null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (timeoutRef.current != null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setRunning(false);
  }, []);

  const tick = React.useCallback(async () => {
    try {
      const res = await fetchStatus();
      const next =
        typeof res === "string" ? ({ status: res } as const) : (res as { status: IngestStatus; message?: string });

      if (!mountedRef.current) return;

      // Normalize "idle" to "processing" when polling is running
      const normalized = next.status === "idle" ? "processing" : next.status;

      setStatus(normalized);
      setMessage("message" in next ? next.message : undefined);

      if (normalized === "ready" || normalized === "error") {
        stop();
        if (normalized === "error" && "message" in next && next.message) setError(next.message);
      }
    } catch (e) {
      if (!mountedRef.current) return;
      setStatus("error");
      setError(e instanceof Error ? e.message : "Polling failed.");
      stop();
    }
  }, [fetchStatus, stop]);

  const start = React.useCallback(() => {
    if (running) return;
    setError(null);
    setMessage(undefined);
    setStatus("processing");
    setRunning(true);

    // First tick immediately for snappy UX
    void tick();

    // Interval loop
    intervalRef.current = window.setInterval(() => {
      void tick();
    }, intervalMs);

    // Optional timeout
    if (typeof timeoutMs === "number" && timeoutMs > 0) {
      timeoutRef.current = window.setTimeout(() => {
        if (!mountedRef.current) return;
        setStatus("error");
        setError("Ingest timed out.");
        stop();
      }, timeoutMs);
    }
  }, [intervalMs, running, tick, timeoutMs, stop]);

  React.useEffect(() => {
    mountedRef.current = true;
    if (immediate) start();
    return () => {
      mountedRef.current = false;
      stop();
    };
  }, [immediate, start, stop]);

  return {
    status,
    message,
    error,
    running,
    start,
    stop,
  };
}
