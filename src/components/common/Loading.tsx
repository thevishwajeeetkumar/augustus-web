export function Loading({ label = "Loading…" }: { label?: string }) {
    return (
      <div className="flex items-center gap-2 text-sm text-white/70">
        <span className="h-3 w-3 animate-spin rounded-full border-2 border-white/30 border-t-white" />
        {label}
      </div>
    );
  }