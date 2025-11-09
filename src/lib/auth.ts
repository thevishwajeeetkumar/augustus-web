// lib/auth.ts
// lightweight client-side auth helpers

import { logoutUser } from "./api";

/** Remove auth cookie by calling backend logout, then hard-redirect. */
export async function signOut(redirect = "/auth/sign-in") {
  try {
    await logoutUser();
  } catch (e) {
    console.warn("Logout failed:", e);
  }
  if (typeof window !== "undefined") window.location.href = redirect;
}

/** Return whether the user appears logged in (simple heuristic). */
export function isAuthenticated(): boolean {
  // We can’t read httpOnly cookies directly; rely on localStorage flag or API ping
  return typeof document !== "undefined" && document.cookie.includes("augustus_token=");
}

/** Optional helper to get token if you decide to store it in memory/localStorage */
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("augustus_access_token");
}

/** Save token for API usage if using Bearer header pattern (optional) */
export function setToken(token: string) {
  if (typeof window !== "undefined") localStorage.setItem("augustus_access_token", token);
}

/** Clear token */
export function clearToken() {
  if (typeof window !== "undefined") localStorage.removeItem("augustus_access_token");
}
