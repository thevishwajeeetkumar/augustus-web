"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type SignupOk = { ok: true; user?: unknown };
type SignupErr = { error: string };
type SignupResponse = SignupOk | SignupErr;
export function SignUpForm({ onSuccessRedirect = "/auth/sign-in" }: { onSuccessRedirect?: string }) {
  const router = useRouter();
  const [username, setUsername] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    if (!username || !email || !password) {
      setError("Please fill all fields.");
      return;
    }

    setLoading(true);
    try {
      // Use Next.js API route which proxies to backend /signup
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password }),
        credentials: "include",
      });

      const data = (await res.json()) as SignupResponse;

      if (!res.ok) {
        const msg = "error" in data && data.error ? data.error : `Sign-up failed (status ${res.status}).`;
        setError(msg);
        return;
      }

      if ("ok" in data && data.ok) {
        router.replace(onSuccessRedirect);
      } else {
        setError("Unexpected response. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4" noValidate>
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          name="username"
          autoComplete="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
          required
        />
      </div>

      {error ? (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      ) : null}

      <Button type="submit" className="w-full rounded-full" disabled={loading}>
        {loading ? "Creating account…" : "Sign up"}
      </Button>
    </form>
  );
}
