import type { ButtonHTMLAttributes, ReactNode } from "react";
import { haptic } from "../lib/tg";

type Variant = "primary" | "ghost" | "amber" | "mint" | "danger";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  block?: boolean;
  prefix?: ReactNode;
  suffix?: ReactNode;
};

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-[var(--color-violet-dim)]/30 hover:bg-[var(--color-violet-dim)]/55 text-[var(--color-violet)] border-[var(--color-violet-dim)] hover:border-[var(--color-violet)]",
  ghost:
    "bg-transparent hover:bg-[var(--color-ink-2)] text-[var(--color-fg-1)] hover:text-[var(--color-fg-0)] border-[var(--color-ink-3)] hover:border-[var(--color-ink-5)]",
  amber:
    "bg-[var(--color-amber-dim)]/30 hover:bg-[var(--color-amber-dim)]/50 text-[var(--color-amber)] border-[var(--color-amber-dim)]",
  mint:
    "bg-[var(--color-mint-dim)]/30 hover:bg-[var(--color-mint-dim)]/50 text-[var(--color-mint)] border-[var(--color-mint-dim)]",
  danger:
    "bg-transparent hover:bg-[#3b1018] text-[var(--color-rose)] border-[#5b1f29]",
};

export function Button({
  variant = "ghost",
  block,
  prefix,
  suffix,
  className = "",
  onClick,
  children,
  ...rest
}: Props) {
  return (
    <button
      onClick={(e) => {
        haptic("tap");
        onClick?.(e);
      }}
      className={`
        inline-flex items-center gap-2 px-3 py-2
        text-[12px] leading-tight tracking-tight
        border rounded transition-colors duration-150
        active:scale-[0.99] disabled:opacity-40 disabled:cursor-not-allowed
        ${block ? "w-full justify-center" : ""}
        ${variantClasses[variant]}
        ${className}
      `}
      {...rest}
    >
      {prefix}
      <span>{children}</span>
      {suffix}
    </button>
  );
}
