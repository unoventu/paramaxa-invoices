import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import type { Client, Invoice, InvoiceLine, SettingsState } from "../lib/types";
import { Frame } from "../components/Frame";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import {
  addDays,
  currentPeriod,
  fmtZAR,
  formatInvoiceNumber,
  shiftPeriod,
  slugify,
  uid,
} from "../lib/format";
import { invoicePdfBlob } from "../lib/pdf";
import { haptic } from "../lib/tg";

type Props = {
  clients: Client[];
  settings: SettingsState;
  preselectClientId?: string;
  quickMode?: boolean;
  onSaveInvoice: (inv: Invoice) => Promise<void>;
  onSaveClient: (c: Client) => Promise<void>;
  onAdvanceNumber: () => Promise<void>;
  onCancel: () => void;
};

type Mode = "pick-client" | "fill" | "done";

export function NewInvoiceScreen({
  clients,
  settings,
  preselectClientId,
  quickMode,
  onSaveInvoice,
  onSaveClient,
  onAdvanceNumber,
  onCancel,
}: Props) {
  const [mode, setMode] = useState<Mode>(preselectClientId ? "fill" : "pick-client");
  const [clientId, setClientId] = useState<string | undefined>(preselectClientId);
  const [search, setSearch] = useState("");
  const [period, setPeriod] = useState(currentPeriod());
  const [lines, setLines] = useState<InvoiceLine[]>([
    { description: `${settings.defaultDescription} — ${currentPeriod()}`, amount: 0 },
  ]);
  const [creatingNew, setCreatingNew] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [lastIssued, setLastIssued] = useState<Invoice | null>(null);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const pdfUrlRef = useRef<string | null>(null);

  const selected = clients.find((c) => c.id === clientId);
  const total = lines.reduce((sum, l) => sum + Number(l.amount || 0), 0);
  const previewNumber = formatInvoiceNumber(settings.invoicePrefix, settings.nextInvoiceNumber);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...clients].sort((a, b) =>
      (b.lastInvoiceAt ?? "").localeCompare(a.lastInvoiceAt ?? ""),
    );
    if (!q) return sorted;
    return sorted.filter(
      (c) => c.name.toLowerCase().includes(q) || c.shortCode.toLowerCase().includes(q),
    );
  }, [clients, search]);

  // Keep first line description in sync with period if it still looks like the default
  useEffect(() => {
    setLines((prev) => {
      const first = prev[0];
      const base = settings.defaultDescription;
      if (first && first.description.startsWith(base)) {
        return [{ description: `${base} — ${period}`, amount: first.amount }, ...prev.slice(1)];
      }
      return prev;
    });
  }, [period, settings.defaultDescription]);

  async function pickClient(id: string) {
    setClientId(id);
    haptic("ok");
    setMode("fill");
  }

  async function createAndPick() {
    if (!newClientName.trim()) return;
    const c: Client = {
      id: uid(),
      name: newClientName.trim().toLowerCase(),
      shortCode: slugify(newClientName),
      createdAt: new Date().toISOString(),
      invoiceCount: 0,
    };
    await onSaveClient(c);
    setCreatingNew(false);
    setNewClientName("");
    setClientId(c.id);
    setMode("fill");
  }

  async function generate() {
    if (!selected) return;
    if (total <= 0) {
      haptic("err");
      return;
    }
    const issuedAt = new Date().toISOString();
    const invoice: Invoice = {
      id: uid(),
      number: previewNumber,
      clientId: selected.id,
      clientSnapshot: { name: selected.name, email: selected.email, address: selected.address },
      period,
      lines: lines.filter((l) => l.amount > 0 && l.description.trim().length > 0),
      currency: "ZAR",
      issuedAt,
      dueAt: addDays(issuedAt, settings.dueDays),
      total,
      status: "issued",
    };
    // Generate PDF FIRST — only burn the invoice number after the blob exists.
    setPdfError(null);
    setPdfUrl(null);
    setMode("done");
    setLastIssued(invoice);

    let blob: Blob;
    try {
      blob = await invoicePdfBlob(invoice);
    } catch (e) {
      console.error("[pdf] blob failed", e);
      setPdfError(e instanceof Error ? e.message : String(e));
      haptic("err");
      return; // do NOT save invoice or advance number — user can retry
    }

    const url = URL.createObjectURL(blob);
    if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
    pdfUrlRef.current = url;
    setPdfUrl(url);

    await onSaveInvoice(invoice);
    await onAdvanceNumber();
    haptic("ok");
  }

  useEffect(() => {
    return () => {
      if (pdfUrlRef.current) URL.revokeObjectURL(pdfUrlRef.current);
    };
  }, []);

  // ── PICK ────────────────────────────────────────────────────────────────
  if (mode === "pick-client") {
    return (
      <div className="flex flex-col gap-3 p-4 pb-24 max-w-[640px] mx-auto">
        <div className="px-1">
          <div className="text-[var(--color-violet)] text-[11px] tracking-widest">
            /new {quickMode ? "· quick tv" : "· custom"}
          </div>
          <h1 className="mt-1 text-[22px] font-medium">select client</h1>
          <p className="mt-1 text-[12px] text-[var(--color-fg-2)]">
            invoice will be issued as{" "}
            <span className="text-[var(--color-violet)]">{previewNumber}</span>
          </p>
        </div>

        <Input
          placeholder="search clients or short code…"
          prefix="⌕"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <Frame title="clients" accent="violet">
          {filtered.length === 0 && !creatingNew && (
            <div className="text-[12px] text-[var(--color-fg-3)] px-1 py-2">
              no matches. create a new client:
            </div>
          )}

          {!creatingNew && filtered.length > 0 && (
            <div className="flex flex-col">
              {filtered.map((c, idx) => (
                <button
                  key={c.id}
                  onClick={() => pickClient(c.id)}
                  className="group flex items-center justify-between gap-3 py-2.5 px-2 -mx-2 border-b border-[var(--color-ink-3)] last:border-b-0 hover:bg-[var(--color-ink-2)]/60 transition-colors rounded"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-[var(--color-fg-3)] text-[10px] tabular-nums w-4">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                      <div className="truncate text-[13px] text-[var(--color-fg-0)] group-hover:text-[var(--color-violet)]">
                        {c.name}
                      </div>
                      <div className="text-[10px] text-[var(--color-fg-3)]">
                        /{c.shortCode} · {c.invoiceCount} sent
                      </div>
                    </div>
                  </div>
                  <span className="text-[var(--color-fg-3)] group-hover:text-[var(--color-violet)]">→</span>
                </button>
              ))}
            </div>
          )}

          <div className="mt-3">
            {creatingNew ? (
              <div className="flex flex-col gap-3">
                <Input
                  label="new client name"
                  placeholder="e.g. nordic content group"
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button variant="primary" onClick={createAndPick}>
                    create &amp; continue
                  </Button>
                  <Button variant="ghost" onClick={() => setCreatingNew(false)}>
                    cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button variant="ghost" block onClick={() => setCreatingNew(true)}>
                + add new client
              </Button>
            )}
          </div>
        </Frame>

        <Button variant="ghost" onClick={onCancel}>
          ← back
        </Button>
      </div>
    );
  }

  // ── FILL ────────────────────────────────────────────────────────────────
  if (mode === "fill" && selected) {
    return (
      <div className="flex flex-col gap-3 p-4 pb-24 max-w-[640px] mx-auto">
        <div className="px-1">
          <div className="text-[var(--color-violet)] text-[11px] tracking-widest">/new · fill</div>
          <h1 className="mt-1 text-[22px] font-medium">
            invoice <span className="text-[var(--color-violet)]">{previewNumber}</span>
          </h1>
          <p className="mt-1 text-[12px] text-[var(--color-fg-2)]">
            for <span className="text-[var(--color-fg-0)]">{selected.name}</span> ·{" "}
            <button
              className="underline decoration-dotted underline-offset-2 hover:text-[var(--color-violet)]"
              onClick={() => setMode("pick-client")}
            >
              change
            </button>
          </p>
        </div>

        {/* Period */}
        <Frame title="period" accent="amber">
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => setPeriod(shiftPeriod(period, -1))}>
              ←
            </Button>
            <div className="flex-1 text-center text-[var(--color-amber)] tabular-nums text-[14px]">
              {period}
            </div>
            <Button variant="ghost" onClick={() => setPeriod(shiftPeriod(period, 1))}>
              →
            </Button>
          </div>
          <div className="mt-2 flex gap-2 justify-center flex-wrap">
            {[-1, 0, 1].map((d) => {
              const p = shiftPeriod(currentPeriod(), d);
              const active = p === period;
              return (
                <button
                  key={d}
                  onClick={() => setPeriod(p)}
                  className={`text-[10px] tracking-wide px-2 py-1 rounded border transition-colors ${
                    active
                      ? "border-[var(--color-amber)] text-[var(--color-amber)] bg-[var(--color-amber-dim)]/20"
                      : "border-[var(--color-ink-3)] text-[var(--color-fg-3)] hover:text-[var(--color-fg-1)]"
                  }`}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </Frame>

        {/* Lines */}
        <Frame title="line items" accent="violet">
          <div className="flex flex-col gap-3">
            {lines.map((l, idx) => (
              <div key={idx} className="flex flex-col gap-2 pb-3 border-b border-[var(--color-ink-3)] last:border-b-0">
                <Input
                  label={`description ${String(idx + 1).padStart(2, "0")}`}
                  value={l.description}
                  onChange={(e) => {
                    const next = [...lines];
                    next[idx] = { ...next[idx], description: e.target.value };
                    setLines(next);
                  }}
                />
                <div className="flex items-end gap-2">
                  <Input
                    label="amount (zar)"
                    inputMode="decimal"
                    prefix="R"
                    placeholder="0.00"
                    value={l.amount === 0 ? "" : String(l.amount)}
                    onChange={(e) => {
                      const v = Number(e.target.value.replace(/[^\d.]/g, "")) || 0;
                      const next = [...lines];
                      next[idx] = { ...next[idx], amount: v };
                      setLines(next);
                    }}
                  />
                  {lines.length > 1 && (
                    <Button
                      variant="danger"
                      onClick={() => setLines(lines.filter((_, i) => i !== idx))}
                    >
                      ✕
                    </Button>
                  )}
                </div>
              </div>
            ))}
            <Button
              variant="ghost"
              block
              onClick={() => setLines([...lines, { description: "", amount: 0 }])}
            >
              + add line
            </Button>
          </div>
        </Frame>

        {/* Total */}
        <Frame accent="mint">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] tracking-wider text-[var(--color-fg-2)]">total due</span>
            <span className="text-[26px] font-medium text-[var(--color-mint)] tabular-nums">
              {fmtZAR(total)}
            </span>
          </div>
        </Frame>

        <Button variant="primary" block onClick={generate} disabled={total <= 0}>
          ▶ generate pdf invoice
        </Button>
        <Button variant="ghost" onClick={onCancel}>
          ← back
        </Button>
      </div>
    );
  }

  // ── DONE ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 p-4 pb-24 max-w-[640px] mx-auto">
      <AnimatePresence>
        {lastIssued && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-4"
          >
            <div className="px-1">
              <div className="text-[var(--color-mint)] text-[11px] tracking-widest">/done</div>
              <h1 className="mt-1 text-[22px] font-medium">
                invoice issued<span className="text-[var(--color-mint)] blink">_</span>
              </h1>
              <p className="mt-1 text-[12px] text-[var(--color-fg-2)]">
                <span className="text-[var(--color-violet)]">{lastIssued.number}</span> ·{" "}
                <span className="text-[var(--color-mint)]">{fmtZAR(lastIssued.total)}</span>
              </p>
            </div>

            <Frame accent="mint" title="receipt">
              <div className="flex flex-col gap-1 text-[12px] font-mono">
                <RowLine label="number" value={lastIssued.number} />
                <RowLine label="client" value={lastIssued.clientSnapshot.name} />
                <RowLine label="period" value={lastIssued.period ?? "—"} />
                <RowLine label="amount" value={fmtZAR(lastIssued.total)} accent="mint" />
              </div>
              <div className="mt-3 pt-3 border-t border-[var(--color-ink-3)]">
                <div className="text-[10px] tracking-wider text-[var(--color-fg-3)] mb-1">
                  for
                </div>
                {lastIssued.lines.map((l, idx) => (
                  <div
                    key={idx}
                    className="flex items-baseline justify-between gap-3 py-1 text-[12px]"
                  >
                    <span className="text-[var(--color-fg-1)] truncate">{l.description}</span>
                    <span className="tabular-nums text-[var(--color-fg-2)] shrink-0">
                      {fmtZAR(l.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </Frame>

            {pdfUrl ? (
              <>
                <Frame title="preview" accent="violet">
                  <iframe
                    src={pdfUrl}
                    title="invoice preview"
                    className="w-full h-[480px] bg-white rounded"
                  />
                </Frame>
                <a
                  href={pdfUrl}
                  download={`${lastIssued.number}-${lastIssued.clientSnapshot.name.replace(/\s+/g, "-")}.pdf`}
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 w-full bg-[var(--color-violet-dim)]/30 hover:bg-[var(--color-violet-dim)]/55 text-[var(--color-violet)] border border-[var(--color-violet-dim)] hover:border-[var(--color-violet)] rounded transition-colors text-[12px]"
                >
                  ⤓ download pdf
                </a>
                <a
                  href={pdfUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-3 py-2 w-full bg-transparent hover:bg-[var(--color-ink-2)] text-[var(--color-fg-1)] hover:text-[var(--color-fg-0)] border border-[var(--color-ink-3)] hover:border-[var(--color-ink-5)] rounded transition-colors text-[12px]"
                >
                  ↗ open in new tab
                </a>
              </>
            ) : pdfError ? (
              <div className="text-[11px] text-[var(--color-rose)] px-3 py-2 border border-[#5b1f29] rounded">
                pdf error: {pdfError}
              </div>
            ) : (
              <div className="text-[12px] text-[var(--color-fg-3)] px-1">
                generating pdf<span className="blink">_</span>
              </div>
            )}
            <Button variant="ghost" block onClick={onCancel}>
              ← back to home
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function RowLine({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent?: "violet" | "mint" | "amber";
}) {
  const color =
    accent === "violet"
      ? "text-[var(--color-violet)]"
      : accent === "mint"
        ? "text-[var(--color-mint)]"
        : accent === "amber"
          ? "text-[var(--color-amber)]"
          : "text-[var(--color-fg-0)]";
  return (
    <div className="flex items-center gap-2">
      <span className="text-[var(--color-fg-3)] w-20">{label}</span>
      <span className="text-[var(--color-fg-3)] flex-1 truncate">
        {".".repeat(Math.max(4, 60 - label.length - value.length))}
      </span>
      <span className={`tabular-nums ${color}`}>{value}</span>
    </div>
  );
}
