import { motion } from "motion/react";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  title?: string;
  accent?: "violet" | "mint" | "amber";
};

const accentMap = {
  violet: "text-[var(--color-violet)]",
  mint: "text-[var(--color-mint)]",
  amber: "text-[var(--color-amber)]",
};

export function Frame({ children, title, accent = "violet" }: Props) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="bg-[var(--color-ink-1)] border border-[var(--color-ink-3)] rounded-md"
    >
      {title && (
        <header
          className={`flex items-center gap-2 px-3 py-2 border-b border-[var(--color-ink-3)] text-[11px] tracking-wide ${accentMap[accent]}`}
        >
          <span className="opacity-60">┌─</span>
          <span className="font-medium uppercase-none">{title}</span>
          <span className="flex-1 opacity-30 truncate">
            {"─".repeat(120)}
          </span>
        </header>
      )}
      <div className="p-4">{children}</div>
    </motion.section>
  );
}
