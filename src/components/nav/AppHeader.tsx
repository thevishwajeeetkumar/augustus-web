"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Logo } from "@/components/nav/Logo";
import { useAuth } from "@/app/hooks/useAuth";

// shadcn/ui primitives
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

type NavItem = {
  label: string;
  href: string;
};

const MARKETING_NAV: readonly NavItem[] = [
  { label: "Home", href: "/" },
  { label: "Features", href: "/#features" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Contact", href: "/#contact" },
];

const APP_NAV: readonly NavItem[] = [
  { label: "Dashboard", href: "/app" },
  { label: "Videos", href: "/app/videos" },
  { label: "Sessions", href: "/app/sessions" },
  { label: "Health", href: "/app/health" },
];

export function AppHeader() {
  const pathname = usePathname() ?? "/";
  const isAppArea = pathname.startsWith("/app");
  const isSignInPage = pathname.startsWith("/auth/sign-in");
  const isSignUpPage = pathname.startsWith("/auth/sign-up");
  const hideCtas = isSignInPage || isSignUpPage;
  const { status, signOut, busy: signingOut } = useAuth({
    initialStatus: isAppArea ? "authenticated" : "unknown",
    signOutRedirect: isAppArea ? "/auth/sign-in" : "/",
  });
  const isAuthenticated = status === "authenticated";

  const navItems = React.useMemo(() => {
    if (isAppArea) return APP_NAV;
    if (isAuthenticated) {
      return [...MARKETING_NAV, { label: "Dashboard", href: "/app" }];
    }
    return MARKETING_NAV;
  }, [isAppArea, isAuthenticated]);

  function isActiveLink(href: string) {
    if (href === "/") {
      return pathname === "/";
    }
    if (href.startsWith("/#")) {
      return pathname === "/";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <header className="sticky top-0 z-40 bg-[linear-gradient(120deg,rgba(5,10,25,0.9)_0%,rgba(6,12,32,0.88)_60%,rgba(9,16,40,0.92)_100%)] backdrop-blur supports-backdrop-filter:bg-[#050b19]/80">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-white/20 to-transparent" />
        <div className="absolute -top-24 left-1/2 h-48 w-[560px] -translate-x-1/2 bg-[radial-gradient(circle,rgba(95,139,255,0.24),transparent_70%)] blur-[120px]" />
      </div>
      <Container className="relative z-10 flex h-16 items-center gap-6">
        {/* logo */}
        <div className="hidden flex-[1.2] md:flex">
          <Logo />
        </div>

        {/* desktop nav */}
        <div className="hidden md:flex flex-[1.4] items-center justify-center">
          <nav className="flex items-center gap-4 rounded-full border border-white/12 bg-[#0a1328]/70 px-4 py-1.5 shadow-[0_18px_42px_rgba(9,14,32,0.6)] backdrop-blur">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                data-active={isActiveLink(item.href) ? "true" : undefined}
                className="group relative inline-flex items-center justify-center rounded-full px-4 py-2 text-sm text-white/80 transition-all duration-300 hover:-translate-y-0.5 hover:text-white data-[active=true]:text-white"
              >
                <span className="absolute inset-0 rounded-full bg-linear-to-r from-white/0 via-white/6 to-white/0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 data-[active=true]:opacity-80" />
                <span className="relative">{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <div className="hidden flex-[1.2] items-center justify-end gap-3 md:flex">
          {hideCtas ? null : isAuthenticated ? (
            isAppArea ? (
              <>
                <Button
                  asChild
                  variant="default"
                  className="rounded-full bg-linear-to-br from-[#5f8bff] via-[#7c5dff] to-[#9a4dff] px-5 py-2 text-white shadow-[0_12px_35px_rgba(100,149,255,0.45)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(100,149,255,0.6)] cursor-pointer"
                >
                  <Link href="/app/videos/new">New video</Link>
                </Button>
                <Button
                  variant="secondary"
                  className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-white transition duration-300 hover:-translate-y-1 hover:bg-white/20 hover:border-white/30 cursor-pointer"
                  onClick={signOut}
                  disabled={signingOut}
                >
                  {signingOut ? "Signing out…" : "Sign out"}
                </Button>
              </>
            ) : (
              <>
                <Button
                  asChild
                  variant="default"
                  className="rounded-full bg-linear-to-br from-[#5f8bff] via-[#7c5dff] to-[#9a4dff] px-5 py-2 text-white shadow-[0_12px_35px_rgba(100,149,255,0.45)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(100,149,255,0.6)] cursor-pointer"
                >
                  <Link href="/app">Go to dashboard</Link>
                </Button>
                <Button
                  variant="secondary"
                  className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-white transition duration-300 hover:-translate-y-1 hover:bg-white/20 hover:border-white/30 cursor-pointer"
                  onClick={signOut}
                  disabled={signingOut}
                >
                  {signingOut ? "Signing out…" : "Sign out"}
                </Button>
              </>
            )
          ) : (
            <>
              <Button
                asChild
                variant="default"
                className="rounded-full bg-linear-to-br from-[#5f8bff] via-[#7c5dff] to-[#9a4dff] px-5 py-2 text-white shadow-[0_12px_35px_rgba(100,149,255,0.45)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_55px_rgba(100,149,255,0.6)] cursor-pointer"
              >
                <Link href={isSignUpPage ? "/auth/sign-in" : "/auth/sign-up"}>
                  {isSignUpPage ? "Sign in" : isSignInPage ? "Sign up" : "Free Trial"}
                </Link>
              </Button>
              <Button
                asChild
                variant="secondary"
                className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-white transition duration-300 hover:-translate-y-1 hover:bg-white/20 hover:border-white/30 cursor-pointer"
              >
                <Link href={isSignInPage ? "/" : "/auth/sign-in"}>
                  {isSignInPage ? "Back home" : "Sign in"}
                </Link>
              </Button>
            </>
          )}
        </div>

        {/* mobile logo */}
        <div className="flex flex-1 justify-start md:hidden">
          <Logo />
        </div>

        {/* mobile menu */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-white transition hover:bg-white/10"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-72 border-l border-white/12 bg-[linear-gradient(160deg,#040916_0%,#060f26_60%,#0c1838_100%)] text-white"
            >
              <div className="pointer-events-none absolute inset-0">
                <div className="absolute top-0 left-0 h-px w-full bg-linear-to-r from-transparent via-white/20 to-transparent" />
                <div className="absolute -top-32 right-10 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(95,139,255,0.28),transparent_68%)] blur-[100px]" />
              </div>
              <nav className="relative z-10 mt-10 flex flex-col gap-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    data-active={isActiveLink(item.href) ? "true" : undefined}
                    className="group flex items-center justify-between rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/75 transition-colors duration-300 hover:border-white/25 hover:bg-white/10 hover:text-white data-[active=true]:border-white/30 data-[active=true]:bg-white/12 data-[active=true]:text-white"
                  >
                    <span className="tracking-wide">{item.label}</span>
                    <span className="text-xs uppercase text-white/40 group-hover:text-white/60">→</span>
                  </Link>
                ))}
                <div className="mt-4 flex flex-col gap-3">
                  {hideCtas ? null : isAuthenticated ? (
                    isAppArea ? (
                      <>
                        <Button
                          asChild
                          className="rounded-full bg-linear-to-r from-[#5f8bff] via-[#7c5dff] to-[#9a4dff] px-5 py-2 text-white shadow-[0_14px_38px_rgba(100,149,255,0.45)] transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_52px_rgba(100,149,255,0.55)]"
                        >
                          <Link href="/app/videos/new">New video</Link>
                        </Button>
                        <Button
                          variant="secondary"
                          className="rounded-full border border-white/20 bg-white/8 px-5 py-2 text-white transition duration-300 hover:-translate-y-0.5 hover:bg-white/16 hover:border-white/35"
                          onClick={signOut}
                          disabled={signingOut}
                        >
                          {signingOut ? "Signing out…" : "Sign out"}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          asChild
                          className="rounded-full bg-linear-to-r from-[#5f8bff] via-[#7c5dff] to-[#9a4dff] px-5 py-2 text-white shadow-[0_14px_38px_rgba(100,149,255,0.45)] transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_52px_rgba(100,149,255,0.55)]"
                        >
                          <Link href="/app">Go to dashboard</Link>
                        </Button>
                        <Button
                          variant="secondary"
                          className="rounded-full border border-white/20 bg-white/8 px-5 py-2 text-white transition duration-300 hover:-translate-y-0.5 hover:bg-white/16 hover:border-white/35"
                          onClick={signOut}
                          disabled={signingOut}
                        >
                          {signingOut ? "Signing out…" : "Sign out"}
                        </Button>
                      </>
                    )
                  ) : (
                    <>
                      <Button
                        asChild
                        className="rounded-full bg-linear-to-r from-[#5f8bff] via-[#7c5dff] to-[#9a4dff] px-5 py-2 text-white shadow-[0_14px_38px_rgba(100,149,255,0.45)] transition-all hover:-translate-y-0.5 hover:shadow-[0_20px_52px_rgba(100,149,255,0.55)]"
                      >
                        <Link href={isSignUpPage ? "/auth/sign-in" : "/auth/sign-up"}>
                          {isSignUpPage ? "Sign in" : isSignInPage ? "Sign up" : "Free Trial"}
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="secondary"
                        className="rounded-full border border-white/20 bg-white/8 px-5 py-2 text-white transition duration-300 hover:-translate-y-0.5 hover:bg-white/16 hover:border-white/35"
                      >
                        <Link href={isSignInPage ? "/" : "/auth/sign-in"}>
                          {isSignInPage ? "Back home" : "Sign in"}
                        </Link>
                      </Button>
                    </>
                  )}
                </div>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </Container>
    </header>
  );
}
