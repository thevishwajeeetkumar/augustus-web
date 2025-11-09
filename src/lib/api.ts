// lib/api.ts
// Generic fetch wrappers for backend endpoints

import { apiUrl } from "./config";
import type {
  AgentQueryRequest,
  AgentQueryResponse,
  TokenPayload,
  User,
} from "./types";

async function handleResponse<T>(res: Response): Promise<T> {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as { error?: string }).error || res.statusText;
    throw new Error(msg);
  }
  return data as T;
}

/** POST /token (login) */
export async function loginUser(username: string, password: string) {
  const res = await fetch(apiUrl("/token"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
    credentials: "include",
  });
  return handleResponse<TokenPayload>(res);
}

/** POST /signup (register) */
export async function registerUser(username: string, email: string, password: string) {
  const res = await fetch(apiUrl("/signup"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
    credentials: "include",
  });
  return handleResponse<{ ok: true; user: User }>(res);
}

/** POST /logout */
export async function logoutUser() {
  const res = await fetch(apiUrl("/logout"), {
    method: "POST",
    credentials: "include",
  });
  if (!res.ok) throw new Error("Logout failed");
  return true;
}

/** POST / (agent query) */
export async function queryAgent(req: AgentQueryRequest) {
  const res = await fetch(apiUrl("/"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(req),
  });
  return handleResponse<AgentQueryResponse>(res);
}

/** GET /health */
export async function fetchHealth() {
  const res = await fetch(apiUrl("/health"), { cache: "no-store" });
  return handleResponse<unknown | string>(res);
}
