import { useMemo, useState } from "react";
import type { Client } from "../lib/types";
import { Frame } from "../components/Frame";
import { Button } from "../components/Button";
import { Input } from "../components/Input";
import { fmtZAR, slugify, uid } from "../lib/format";

type Props = {
  clients: Client[];
  onSave: (c: Client) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

export function ClientsScreen({ clients, onSave, onDelete }: Props) {
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...clients].sort((a, b) => a.name.localeCompare(b.name));
    if (!q) return sorted;
    return sorted.filter(
      (c) => c.name.toLowerCase().includes(q) || c.shortCode.toLowerCase().includes(q),
    );
  }, [clients, search]);

  if (editingId) {
    const initial =
      editingId === "new"
        ? {
            id: uid(),
            name: "",
            shortCode: "",
            createdAt: new Date().toISOString(),
            invoiceCount: 0,
          }
        : clients.find((c) => c.id === editingId);
    if (!initial) return null;
    return (
      <ClientEditor
        initial={initial as Client}
        onCancel={() => setEditingId(null)}
        onSave={async (c) => {
          await onSave(c);
          setEditingId(null);
        }}
        onDelete={
          editingId === "new"
            ? undefined
            : async () => {
                await onDelete(initial.id);
                setEditingId(null);
              }
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4 pb-24 max-w-[640px] mx-auto">
      <div className="px-1">
        <div className="text-[var(--color-violet)] text-[11px] tracking-widest">/clients</div>
        <h1 className="mt-1 text-[22px] font-medium">
          {clients.length} entr{clients.length === 1 ? "y" : "ies"}
        </h1>
      </div>

      <Input
        placeholder="search…"
        prefix="⌕"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <Button variant="primary" onClick={() => setEditingId("new")}>
        + new client
      </Button>

      <Frame title="all clients" accent="violet">
        {filtered.length === 0 ? (
          <div className="text-[12px] text-[var(--color-fg-3)] px-1 py-3">no matches.</div>
        ) : (
          <div className="flex flex-col">
            {filtered.map((c, idx) => (
              <button
                key={c.id}
                onClick={() => setEditingId(c.id)}
                className="group flex items-center justify-between gap-3 py-2.5 px-2 -mx-2 border-b border-[var(--color-ink-3)] last:border-b-0 hover:bg-[var(--color-ink-2)]/60 rounded transition-colors text-left"
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
                      {c.defaultAmount ? ` · ${fmtZAR(c.defaultAmount)}` : ""}
                    </div>
                  </div>
                </div>
                <span className="text-[var(--color-fg-3)] group-hover:text-[var(--color-violet)]">→</span>
              </button>
            ))}
          </div>
        )}
      </Frame>
    </div>
  );
}

function ClientEditor({
  initial,
  onCancel,
  onSave,
  onDelete,
}: {
  initial: Client;
  onCancel: () => void;
  onSave: (c: Client) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [c, setC] = useState<Client>(initial);
  const isNew = !initial.name;

  return (
    <div className="flex flex-col gap-3 p-4 pb-24 max-w-[640px] mx-auto">
      <div className="px-1">
        <div className="text-[var(--color-violet)] text-[11px] tracking-widest">
          /clients · {isNew ? "new" : "edit"}
        </div>
        <h1 className="mt-1 text-[22px] font-medium">{isNew ? "create client" : c.name}</h1>
      </div>

      <Frame title="profile" accent="violet">
        <div className="flex flex-col gap-3">
          <Input
            label="name"
            placeholder="e.g. acme productions ltd"
            value={c.name}
            onChange={(e) => {
              const name = e.target.value;
              setC({
                ...c,
                name,
                shortCode: c.shortCode || slugify(name),
              });
            }}
            autoFocus
          />
          <Input
            label="short code"
            prefix="/"
            value={c.shortCode}
            onChange={(e) => setC({ ...c, shortCode: e.target.value.toLowerCase() })}
            hint="used for quick search"
          />
          <Input
            label="email (optional)"
            type="email"
            value={c.email ?? ""}
            onChange={(e) => setC({ ...c, email: e.target.value || undefined })}
          />
          <Input
            label="address (optional)"
            value={c.address ?? ""}
            onChange={(e) => setC({ ...c, address: e.target.value || undefined })}
            hint="single line for now"
          />
          <Input
            label="default amount (optional)"
            prefix="R"
            inputMode="decimal"
            value={c.defaultAmount?.toString() ?? ""}
            onChange={(e) =>
              setC({ ...c, defaultAmount: Number(e.target.value) || undefined })
            }
          />
        </div>
      </Frame>

      <Button
        variant="primary"
        block
        onClick={() => onSave(c)}
        disabled={!c.name.trim() || !c.shortCode.trim()}
      >
        ▶ save
      </Button>
      {onDelete && (
        <Button variant="danger" block onClick={onDelete}>
          ✕ delete client
        </Button>
      )}
      <Button variant="ghost" block onClick={onCancel}>
        ← cancel
      </Button>
    </div>
  );
}
