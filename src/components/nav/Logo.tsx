"use client";

import * as React from "react";
import Link from "next/link";

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 text-white hover:opacity-90 transition"
    >
      <div className="h-5 w-5 rounded-full bg-white" />
      <span className="text-sm font-semibold tracking-wide">Aurion</span>
    </Link>
  );
}
