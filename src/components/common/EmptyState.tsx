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
      <div className="rounded-xl border border-white/10 bg-white/5 p-8 text-center">
        <div className="mx-auto mb-3 h-10 w-10 rounded-full bg-white/10" />
        <h3 className="text-base font-semibold text-white">{title}</h3>
        <p className="mt-1 text-sm text-white/70">{description}</p>
        {action ? <div className="mt-4">{action}</div> : null}
      </div>
    );
  }
  