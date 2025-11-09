"use client";

import Link from "next/link";
import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Container } from "@/components/layout/Container";
import { SignInForm } from "@/components/auth/SignInForm";
import { Card, CardContent } from "@/components/ui/card";

function SignInPageContent() {
  const params = useSearchParams();
  const next = params.get("next") || "/app";

  return (
    <main className="min-h-screen bg-[#0a0f1c] text-white">
      <Container className="py-16">
        <div className="mx-auto max-w-md">
          <h1 className="mb-4 text-2xl font-semibold">Sign in</h1>
          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-6">
              <SignInForm next={next} />
            </CardContent>
          </Card>
          <p className="mt-4 text-sm text-white/70">
            Don’t have an account?{" "}
            <Link href="/auth/sign-up" className="underline">
              Sign up
            </Link>
          </p>
        </div>
      </Container>
    </main>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#0a0f1c] text-white">
          <Container className="py-16">
            <div className="mx-auto max-w-md">
              <h1 className="mb-4 text-2xl font-semibold">Sign in</h1>
            </div>
          </Container>
        </main>
      }
    >
      <SignInPageContent />
    </Suspense>
  );
}
