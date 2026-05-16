import { motion } from "motion/react";
import type { Screen } from "../App";

type Props = {
  current: Screen;
  onChange: (s: Screen) => void;
};

const tabs: { id: Screen; label: string; icon: string }[] = [
  { id: "home", label: "home", icon: "◍" },
  { id: "new", label: "new", icon: "+" },
  { id: "clients", label: "clients", icon: "⚇" },
  { id: "history", label: "history", icon: "≡" },
];

export function TabBar({ current, onChange }: Props) {
  return (
    <nav className="sticky bottom-0 z-30 bg-[var(--color-ink-1)] border-t border-[var(--color-ink-3)] pb-[env(safe-area-inset-bottom)]">
      <div className="max-w-[640px] mx-auto grid grid-cols-4">
        {tabs.map((t) => {
          const active = current === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className={`relative flex flex-col items-center justify-center gap-1 py-3 transition-colors ${
                active ? "text-[var(--color-violet)]" : "text-[var(--color-fg-2)] hover:text-[var(--color-fg-1)]"
              }`}
            >
              <span className="text-[18px] leading-none">{t.icon}</span>
              <span className="text-[10px] tracking-wide">{t.label}</span>
              {active && (
                <motion.span
                  layoutId="tab-indicator"
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-[2px] bg-[var(--color-violet)]"
                  transition={{ type: "spring", stiffness: 500, damping: 32 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
