import { useMemo } from "react";
import type { Invoice } from "../lib/types";
import { Frame } from "../components/Frame";
import { Button } from "../components/Button";
import { fmtDate, fmtZAR } from "../lib/format";
import { downloadInvoicePdf } from "../lib/pdf";

type Props = {
  invoices: Invoice[];
};

export function HistoryScreen({ invoices }: Props) {
  const sorted = useMemo(
    () => [...invoices].sort((a, b) => b.issuedAt.localeCompare(a.issuedAt)),
    [invoices],
  );

  const total = invoices.reduce((s, i) => s + i.total, 0);

  return (
    <div className="flex flex-col gap-3 p-4 pb-24 w-full max-w-[640px] mx-auto">
      <div className="px-1">
        <div className="text-[var(--color-violet)] text-[11px] tracking-widest">/history</div>
        <h1 className="mt-1 text-[22px] font-medium">{invoices.length} issued</h1>
        <p className="mt-1 text-[12px] text-[var(--color-fg-2)]">
          all-time gross{" "}
          <span className="text-[var(--color-mint)] tabular-nums">{fmtZAR(total)}</span>
        </p>
      </div>

      <Frame title="invoices" accent="mint">
        {sorted.length === 0 ? (
          <div className="text-[12px] text-[var(--color-fg-3)] px-1 py-3">
            no invoices yet.
          </div>
        ) : (
          <div className="flex flex-col">
            {sorted.map((inv, idx) => (
              <div
                key={inv.id}
                className="flex items-center justify-between gap-3 py-2.5 px-2 -mx-2 border-b border-[var(--color-ink-3)] last:border-b-0"
              >
                <div className="min-w-0 flex items-start gap-3">
                  <span className="text-[var(--color-fg-3)] text-[10px] tabular-nums w-6 pt-1">
                    {String(idx + 1).padStart(2, "0")}
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[13px]">
                      <span className="text-[var(--color-violet)] tabular-nums">{inv.number}</span>
                      <span className="text-[var(--color-fg-3)]">·</span>
                      <span className="truncate text-[var(--color-fg-0)]">
                        {inv.clientSnapshot.name}
                      </span>
                    </div>
                    <div className="text-[10px] text-[var(--color-fg-3)]">
                      {fmtDate(inv.issuedAt)} · {inv.period ?? "—"}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[var(--color-mint)] tabular-nums text-[12px]">
                    {fmtZAR(inv.total)}
                  </span>
                  <Button variant="ghost" onClick={() => downloadInvoicePdf(inv)}>
                    ⤓
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Frame>
    </div>
  );
}
