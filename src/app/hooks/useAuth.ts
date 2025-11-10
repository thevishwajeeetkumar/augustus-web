"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

type SessionResponse = {
  authenticated: boolean;
  user?: Record<string, unknown> | null;
};

export type AuthStatus = "unknown" | "authenticated" | "unauthenticated";

type UseAuthOptions = {
  /** Optional server-provided hint for the current page */
  initialStatus?: AuthStatus;
  /** Where to send the user after sign-out */
  signOutRedirect?: string; // default: "/auth/sign-in"
};

export function useAuth(options: UseAuthOptions = {}) {
  const { initialStatus = "unknown", signOutRedirect = "/auth/sign-in" } = options;
  const router = useRouter();

  const [status, setStatus] = React.useState<AuthStatus>(initialStatus);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [user, setUser] = React.useState<Record<string, unknown> | null>(null);

  const loadSession = React.useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/session", {
        method: "GET",
        credentials: "include",
        cache: "no-store",
      });
      if (!res.ok) {
        throw new Error(`Session check failed (status ${res.status}).`);
      }
      const data = (await res.json()) as SessionResponse;
      if (data.authenticated) {
        setStatus("authenticated");
        setUser(data.user ?? null);
      } else {
        setStatus("unauthenticated");
        setUser(null);
      }
    } catch (e) {
      setStatus("unauthenticated");
      setUser(null);
      if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("Unable to verify session.");
      }
    } finally {
      setBusy(false);
    }
  }, []);

  React.useEffect(() => {
    if (initialStatus === "unknown") {
      void loadSession();
    } else {
      setStatus(initialStatus);
      if (initialStatus !== "authenticated") {
        setUser(null);
      }
    }
  }, [initialStatus, loadSession]);

  /**
   * Call from a sign-out button. Clears the httpOnly cookie on the server and redirects.
   */
  const signOut = React.useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/logout", { method: "POST" });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data?.error || `Sign-out failed (status ${res.status}).`);
      }
      setStatus("unauthenticated");
      setUser(null);
      router.replace(signOutRedirect);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign-out failed.");
    } finally {
      setBusy(false);
    }
  }, [router, signOutRedirect]);

  /**
   * Helper to enforce auth on client-only sections (rare; middleware already protects /app/*).
   * If unauthenticated, navigate to sign-in with ?next=<path>.
   */
  const ensureAuthenticated = React.useCallback(
    (redirectToSignIn = true) => {
      if (status === "unauthenticated" && redirectToSignIn) {
        const next = typeof window !== "undefined" ? window.location.pathname : "/app";
        router.replace(`/auth/sign-in?next=${encodeURIComponent(next)}`);
      }
    },
    [router, status]
  );

  return {
    status,
    setStatus, // in case a server component passes a new hint
    user,
    busy,
    error,
    signOut,
    ensureAuthenticated,
    refresh: loadSession,
  };
}
