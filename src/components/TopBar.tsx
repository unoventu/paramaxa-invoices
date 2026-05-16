import { motion } from "motion/react";
import type { ReactNode } from "react";

type Props = {
  title?: string;
  back?: () => void;
  right?: ReactNode;
};

export function TopBar({ title = "paramaxa", back, right }: Props) {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-[var(--color-ink-0)]/85 border-b border-[var(--color-ink-3)]">
      <div className="flex items-center gap-3 px-4 h-12 max-w-[640px] mx-auto">
        {back ? (
          <button
            onClick={back}
            className="text-[var(--color-violet)] text-[12px] tracking-wider hover:text-[var(--color-fg-0)] transition-colors"
            aria-label="back"
          >
            ← back
          </button>
        ) : (
          <div className="flex items-center gap-2 text-[var(--color-violet)] text-[12px]">
            <motion.span
              className="inline-block w-2 h-2 rounded-full bg-[var(--color-mint)]"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              aria-hidden
            />
            <span className="font-medium">{title}</span>
          </div>
        )}
        <div className="flex-1 text-center text-[10px] text-[var(--color-fg-3)] truncate">
          {back ? title : "—— invoice terminal ——"}
        </div>
        <div className="min-w-[40px] flex justify-end">{right}</div>
      </div>
    </header>
  );
}
