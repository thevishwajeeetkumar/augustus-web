"use client";

import Link from "next/link";
import { Container } from "@/components/layout/Container";
import { SignUpForm } from "@/components/auth/SignUpForm";
import { Card, CardContent } from "@/components/ui/card";

export default function SignUpPage() {
  return (
    <main className="min-h-screen bg-[#0a0f1c] text-white">
      <Container className="py-16">
        <div className="mx-auto max-w-md">
          <h1 className="mb-4 text-2xl font-semibold">Create account</h1>
          <Card className="border-white/10 bg-white/5">
            <CardContent className="p-6">
              <SignUpForm onSuccessRedirect="/auth/sign-in" />
            </CardContent>
          </Card>
          <p className="mt-4 text-sm text-white/70">
            Already have an account?{" "}
            <Link href="/auth/sign-in" className="underline">
              Sign in
            </Link>
          </p>
        </div>
      </Container>
    </main>
  );
}
