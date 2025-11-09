// lib/config.ts
// global config + environment helpers

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/+$/, "") || "http://localhost:8000";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || "http://localhost:3000";

/**
 * Helper to build a full backend URL path.
 * Example: apiUrl("/token") -> "http://localhost:8000/token"
 */
export function apiUrl(path: string) {
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}
