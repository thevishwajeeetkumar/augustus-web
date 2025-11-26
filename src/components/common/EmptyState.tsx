import * as React from "react";

type Props = {
  title?: string;
  description?: string;
  action?: React.ReactNode;
};

export function EmptyState({
  title = "Nothing here yet",
  description = "Get started by adding your first item.",
  action,
}: Props) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-[#0b1120]/70 p-10 text-center shadow-[0_20px_60px_rgba(15,23,42,0.55)]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(95,139,255,0.16),transparent_60%),radial-gradient(circle_at_bottom,rgba(154,77,255,0.18),transparent_65%)]" />
      <div className="relative z-10 space-y-4">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/70">
          ✨
        </div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mx-auto max-w-sm text-sm text-white/70">{description}</p>
        {action ? <div className="pt-2">{action}</div> : null}
      </div>
    </div>
  );
}