"use client";

import * as React from "react";
import Link from "next/link";
import { Menu } from "lucide-react";
import { Container } from "@/components/layout/Container";
import { Logo } from "@/components/nav/Logo";

// shadcn/ui primitives
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV_ITEMS = [
  { label: "Home", href: "/" },
  { label: "Features", href: "#features" },
  { label: "Pricing", href: "#pricing" },
  { label: "Contact", href: "#contact" },
];

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0a0f1c]/70 backdrop-blur supports-backdrop-filter:bg-[#0a0f1c]/60">
      <Container className="flex h-14 items-center justify-between">
        {/* logo */}
        <Logo />

        {/* desktop nav */}
        <div className="hidden md:flex items-center gap-6">
          <NavigationMenu>
            <NavigationMenuList>
              {NAV_ITEMS.map((item) => (
                <NavigationMenuItem key={item.href}>
                  <Link href={item.href}>
                    <NavigationMenuLink className="text-sm text-white/80 hover:text-white transition-colors">
                      {item.label}
                    </NavigationMenuLink>
                  </Link>
                </NavigationMenuItem>
              ))}
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex items-center gap-3">
            <Button
              asChild
              variant="default"
              className="rounded-full text-gray-900"
            >
              <Link href="/auth/sign-up">Free Trial</Link>
            </Button>
            <Link
              href="/auth/sign-in"
              className="text-sm text-white/80 hover:text-white"
            >
              Sign in
            </Link>
          </div>
        </div>

        {/* mobile menu */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/10"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent
              side="right"
              className="w-72 bg-[#0a0f1c] text-white border-white/10"
            >
              <nav className="mt-8 flex flex-col gap-4">
                {NAV_ITEMS.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-md px-2 py-2 text-base text-white/90 hover:bg-white/5"
                  >
                    {item.label}
                  </Link>
                ))}
                <Button asChild className="rounded-full text-gray-900">
                  <Link href="/auth/sign-up">Free Trial</Link>
                </Button>
                <Link
                  href="/auth/sign-in"
                  className="text-sm text-white/80 hover:text-white"
                >
                  Sign in
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </Container>
    </header>
  );
}
