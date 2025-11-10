import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  glow?: boolean;
};

export function BrandWordmark({ className, glow = true }: Props) {
  return (
    <span
      className={cn(
        "font-semibold uppercase tracking-[0.3em] text-white",
        glow && "drop-shadow-[0_4px_20px_rgba(94,133,255,0.45)]",
        className
      )}
    >
      <span className="bg-linear-to-r from-[#5f8bff] via-[#7c5dff] to-[#9a4dff] bg-clip-text text-transparent">
        AugustuS
      </span>
    </span>
  );
}

