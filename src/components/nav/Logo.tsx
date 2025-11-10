"use client";

import * as React from "react";
import Link from "next/link";
import { BrandWordmark } from "@/components/common/BrandWordmark";

export function Logo() {
  return (
    <Link
      href="/"
      className="group flex items-center gap-3 text-white transition hover:opacity-90"
    >
      <div className="relative flex h-8 w-8 items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-[#090f1f]/80 shadow-[0_12px_35px_rgba(94,133,255,0.35)] transition-transform duration-300 group-hover:rotate-3 group-hover:scale-105">
        <div className="absolute inset-0 bg-linear-to-br from-[#5f8bff]/40 via-[#7c5dff]/35 to-[#9a4dff]/40 opacity-80" />
        <svg viewBox="0 0 32 32" className="relative h-5 w-5 text-white/85">
          <path
            d="M8.5 23.5 16 8l7.5 15.5M12.5 22.5h7"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <BrandWordmark className="hidden text-base sm:flex" />
    </Link>
  );
}
