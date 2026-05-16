import { useMemo } from "react";
import { motion } from "motion/react";
import type { Client, Invoice, SettingsState } from "../lib/types";
import { Frame } from "../components/Frame";
import { Button } from "../components/Button";
import { currentPeriod, fmtZAR, formatInvoiceNumber } from "../lib/format";

type Props = {
  clients: Client[];
  invoices: Invoice[];
  settings: SettingsState;
  onPickQuickTV: () => void;
  onPickClient: (clientId: string) => void;
  onGoNew: () => void;
};

export function HomeScreen({ clients, invoices, settings, onPickQuickTV, onPickClient, onGoNew }: Props) {
  const recent = useMemo(
    () =>
      [...clients]
        .sort((a, b) => (b.lastInvoiceAt ?? "").localeCompare(a.lastInvoiceAt ?? ""))
        .slice(0, 5),
    [clients],
  );

  const stats = useMemo(() => {
    const month = currentPeriod();
    const monthInvoices = invoices.filter((i) => i.period === month);
    const total = monthInvoices.reduce((sum, i) => sum + i.total, 0);
    return { count: monthInvoices.length, total, month };
  }, [invoices]);

  const nextNumber = formatInvoiceNumber(settings.invoicePrefix, settings.nextInvoiceNumber);

  return (
    <div className="flex flex-col gap-4 p-4 pb-24 max-w-[640px] mx-auto">
      {/* Greeting / pulse */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="px-1 pt-1"
      >
        <div className="flex items-baseline gap-2">
          <span className="text-[var(--color-violet)] text-[11px] tracking-widest">/paramaxa</span>
          <span className="text-[var(--color-fg-3)] text-[10px]">{stats.month}</span>
        </div>
        <h1 className="mt-1 text-[26px] leading-tight font-medium text-[var(--color-fg-0)]">
          ready to issue<span className="text-[var(--color-violet)] blink">_</span>
        </h1>
        <p className="mt-1 text-[12px] text-[var(--color-fg-2)]">
          next invoice will be{" "}
          <span className="text-[var(--color-violet)]">{nextNumber}</span> · period{" "}
          <span className="text-[var(--color-amber)]">{stats.month}</span>
        </p>
      </motion.div>

      {/* Quick TV card */}
      <Frame title="quick · television broadcasting" accent="violet">
        <p className="text-[12px] text-[var(--color-fg-2)] mb-3">
          one-tap invoice for the typical service. description and period are pre-filled with current month.
        </p>
        <Button variant="primary" block onClick={onPickQuickTV}>
          ▶ start tv invoice — period {stats.month}
        </Button>
      </Frame>

      {/* Month stats */}
      <div className="grid grid-cols-2 gap-3">
        <Frame accent="mint">
          <div className="flex flex-col gap-1">
            <div className="text-[10px] tracking-wider text-[var(--color-fg-3)]">issued this month</div>
            <div className="text-[28px] leading-none font-medium text-[var(--color-mint)] tabular-nums">
              {String(stats.count).padStart(2, "0")}
            </div>
            <div className="text-[10px] text-[var(--color-fg-3)]">invoices</div>
          </div>
        </Frame>
        <Frame accent="amber">
          <div className="flex flex-col gap-1">
            <div className="text-[10px] tracking-wider text-[var(--color-fg-3)]">total this month</div>
            <div className="text-[18px] leading-none font-medium text-[var(--color-amber)] tabular-nums">
              {stats.total > 0 ? fmtZAR(stats.total) : "R 0.00"}
            </div>
            <div className="text-[10px] text-[var(--color-fg-3)]">zar</div>
          </div>
        </Frame>
      </div>

      {/* Recent clients */}
      <Frame title="recent clients" accent="violet">
        {recent.length === 0 ? (
          <div className="text-[12px] text-[var(--color-fg-3)]">no clients yet. start a new invoice.</div>
        ) : (
          <div className="flex flex-col">
            {recent.map((c, idx) => (
              <button
                key={c.id}
                onClick={() => onPickClient(c.id)}
                className="group flex items-center justify-between gap-3 py-2.5 border-b border-[var(--color-ink-3)] last:border-b-0 hover:bg-[var(--color-ink-2)]/50 px-2 -mx-2 rounded transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-[var(--color-fg-3)] text-[10px] tabular-nums w-4">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-[13px] text-[var(--color-fg-0)] group-hover:text-[var(--color-violet)] transition-colors">
                      {c.name}
                    </div>
                    <div className="text-[10px] text-[var(--color-fg-3)]">
                      /{c.shortCode} · {c.invoiceCount} sent
                      {c.defaultAmount ? ` · ${fmtZAR(c.defaultAmount)}` : ""}
                    </div>
                  </div>
                </div>
                <span className="text-[var(--color-fg-3)] group-hover:text-[var(--color-violet)] transition-colors">
                  →
                </span>
              </button>
            ))}
          </div>
        )}
        <div className="mt-3">
          <Button variant="ghost" block onClick={onGoNew}>
            + new client / custom invoice
          </Button>
        </div>
      </Frame>
    </div>
  );
}
