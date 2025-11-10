import * as React from "react"

import { cn } from "@/lib/utils"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "min-h-24 w-full rounded-2xl border border-white/15 bg-white/8 px-4 py-3 text-sm text-white shadow-[0_12px_28px_rgba(12,18,45,0.35)] transition-all duration-200 placeholder:text-white/40 focus-visible:border-white/35 focus-visible:bg-white/14 focus-visible:shadow-[0_18px_40px_rgba(12,18,45,0.5)]",
        "selection:bg-[#7c5dff]/40 selection:text-white",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
