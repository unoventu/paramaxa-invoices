import type { InputHTMLAttributes, ReactNode } from "react";

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  hint?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  error?: string;
};

export function Input({
  label,
  hint,
  prefix,
  suffix,
  error,
  className = "",
  ...rest
}: Props) {
  return (
    <label className="block">
      {label && (
        <div className="flex items-center gap-2 mb-1 text-[10px] tracking-wider uppercase-none text-[var(--color-fg-2)]">
          <span className="text-[var(--color-violet)] opacity-70">▌</span>
          <span>{label}</span>
        </div>
      )}
      <div
        className={`
          flex items-center gap-2 px-3 py-2.5 min-w-0 max-w-full overflow-hidden
          bg-[var(--color-ink-2)]
          border border-[var(--color-ink-3)]
          focus-within:border-[var(--color-violet)]
          focus-within:bg-[var(--color-ink-3)]
          rounded transition-colors duration-150
          ${error ? "border-[var(--color-rose)]" : ""}
        `}
      >
        {prefix && <span className="text-[var(--color-fg-2)] text-sm shrink-0">{prefix}</span>}
        <input
          style={{ minWidth: 0, width: "100%", fontSize: 16 }}
          className={`flex-1 placeholder:text-[var(--color-fg-3)] ${className}`}
          {...rest}
        />
        {suffix && <span className="text-[var(--color-fg-2)] text-sm shrink-0">{suffix}</span>}
      </div>
      {(hint || error) && (
        <div
          className={`mt-1 text-[10px] ${error ? "text-[var(--color-rose)]" : "text-[var(--color-fg-3)]"}`}
        >
          {error || hint}
        </div>
      )}
    </label>
  );
}
