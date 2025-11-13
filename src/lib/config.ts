// lib/config.ts
// global config + environment helpers

// Validate URL format
function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE?.replace(/\/+$/, "") || "http://127.0.0.1:8000";

// Validate API_BASE at module level
if (!validateUrl(API_BASE)) {
  console.error(`Invalid API_BASE configuration: ${API_BASE}`);
}

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || "http://localhost:3000";

/**
 * Helper to build a full backend URL path.
 * Example: apiUrl("/token") -> "http://127.0.0.1:8000/token"
 */
export function apiUrl(path: string) {
  if (path.startsWith("http")) return path;
  return `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
}
