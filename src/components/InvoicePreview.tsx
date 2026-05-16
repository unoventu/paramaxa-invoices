import type { Invoice } from "../lib/types";
import { fmtDate, fmtZAR } from "../lib/format";

// HTML/CSS/SVG mirror of the pdfkit invoice in src/lib/pdf-builder.ts.
// Renders identically to the PDF on every device (no iframe / no PDF.js).

const VIOLET = "var(--color-violet)";
const VIOLET_DEEP = "#6b46c1";
const FG = "var(--color-fg-0)";
const DIM = "var(--color-fg-2)";
const FAINT = "var(--color-fg-3)";
const MINT = "var(--color-mint)";
const PAPER_BG = "#fafafa";
const PAPER_FG = "#0a0a0c";

// Width in CSS pixels. The actual PDF is 400×720pt — we mirror that ratio.
const PAGE_W = 360;

export function InvoicePreview({ invoice }: { invoice: Invoice }) {
  return (
    <div
      style={{
        background: PAPER_BG,
        color: PAPER_FG,
        width: "100%",
        maxWidth: PAGE_W,
        margin: "0 auto",
        fontFamily: "'JetBrains Mono', ui-monospace, monospace",
        fontSize: 9,
        lineHeight: 1.4,
        padding: "20px 18px 16px",
        borderRadius: 4,
        boxShadow: "0 6px 20px rgba(0,0,0,0.4)",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* top double rule */}
      <Rule color={VIOLET} ch="═" />

      {/* brand header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginTop: 6 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 1.5, color: PAPER_FG }}>
            PARAMAXA
          </div>
          <div style={{ fontSize: 7, color: "#666", marginTop: 4 }}>
            (Pty) Ltd · Cape Town · South Africa
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: VIOLET_DEEP }}>invoice</div>
          <div style={{ fontSize: 9, color: VIOLET_DEEP, marginTop: 4 }}>{invoice.number}</div>
        </div>
      </div>

      <Rule color={VIOLET} ch="═" />

      {/* meta rows */}
      <div style={{ marginTop: 8, marginBottom: 8 }}>
        <Row label="issued" value={fmtDate(invoice.issuedAt)} />
        <Row label="due" value={fmtDate(invoice.dueAt)} />
        {invoice.period && <Row label="period" value={invoice.period} />}
      </div>

      <SectionTitle title="bill to" />
      <div style={{ paddingLeft: 4, paddingTop: 2, paddingBottom: 6 }}>
        <div>{invoice.clientSnapshot.name}</div>
        {invoice.clientSnapshot.email && <div>{invoice.clientSnapshot.email}</div>}
        {invoice.clientSnapshot.address &&
          invoice.clientSnapshot.address.split("\n").map((line, i) => <div key={i}>{line}</div>)}
      </div>

      <SectionTitle title="description" right="amount (zar)" />
      <div style={{ paddingLeft: 4, paddingTop: 2, paddingBottom: 6 }}>
        {invoice.lines.map((l, i) => (
          <div
            key={i}
            style={{ display: "flex", justifyContent: "space-between", gap: 8, marginBottom: 2 }}
          >
            <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {l.description}
            </span>
            <span style={{ whiteSpace: "nowrap" }}>{fmtZAR(l.amount)}</span>
          </div>
        ))}
      </div>

      <SectionTitle title="total" />
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2, paddingTop: 4, paddingBottom: 6 }}>
        <div style={{ display: "flex", gap: 12, fontSize: 9 }}>
          <span style={{ minWidth: 60, textAlign: "right" }}>subtotal</span>
          <span style={{ minWidth: 80, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
            {fmtZAR(invoice.total)}
          </span>
        </div>
        <div style={{ display: "flex", gap: 12, fontSize: 10, fontWeight: 700, color: VIOLET_DEEP }}>
          <span style={{ minWidth: 60, textAlign: "right" }}>total due</span>
          <span style={{ minWidth: 80, textAlign: "right", fontVariantNumeric: "tabular-nums" }}>
            {fmtZAR(invoice.total)}
          </span>
        </div>
      </div>

      <SectionTitle title="banking details" />
      <div style={{ paddingLeft: 4, paddingTop: 2, paddingBottom: 8 }}>
        <KV k="beneficiary" v="Paramaxa (Pty) Ltd" />
        <KV k="bank" v="First National Bank (FNB)" />
        <KV k="account number" v="63066403783" />
        <KV k="branch" v="Greenpoint" />
        <KV k="branch code" v="210651" />
      </div>

      <Rule color="#bbb" ch="─" />

      <div style={{ paddingLeft: 4, paddingTop: 4, fontSize: 9 }}>
        <div>Payment due by {fmtDate(invoice.dueAt)}.</div>
        <div style={{ color: MINT_PAPER }}>Please use {invoice.number} as payment reference.</div>
        <div style={{ color: "#666" }}>Issued in Cape Town · South Africa.</div>
      </div>

      {/* signature + stamp row */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 12 }}>
        <SignatureSvg />
        <StampSvg />
      </div>

      <div style={{ marginTop: 12, paddingLeft: 4, color: VIOLET_DEEP, fontSize: 10 }}>
        &gt; thank_you_
      </div>

      <Rule color={VIOLET} ch="═" />
    </div>
  );
}

const MINT_PAPER = "#1a8a4c"; // darker mint that reads well on light paper

function Rule({ color, ch }: { color: string; ch: string }) {
  return (
    <div
      style={{
        color,
        fontSize: 9,
        lineHeight: 1,
        whiteSpace: "nowrap",
        overflow: "hidden",
        marginBlock: 4,
      }}
    >
      {ch.repeat(80)}
    </div>
  );
}

function SectionTitle({ title, right }: { title: string; right?: string }) {
  return (
    <div
      style={{
        color: "#888",
        fontSize: 9,
        display: "flex",
        alignItems: "center",
        gap: 6,
        marginTop: 4,
        marginBottom: 2,
      }}
    >
      <span>── {title}</span>
      <span style={{ flex: 1, overflow: "hidden", whiteSpace: "nowrap" }}>
        {"─".repeat(80)}
      </span>
      {right && <span>{right} ───</span>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
      <span style={{ color: PAPER_FG }}>{label}</span>
      <span
        style={{
          flex: 1,
          overflow: "hidden",
          whiteSpace: "nowrap",
          color: "#bbb",
          textOverflow: "clip",
        }}
      >
        {".".repeat(80)}
      </span>
      <span style={{ color: PAPER_FG, fontVariantNumeric: "tabular-nums" }}>{value}</span>
    </div>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      <span style={{ minWidth: 88 }}>{k}</span>
      <span style={{ color: "#999" }}>{".".repeat(8)}</span>
      <span>{v}</span>
    </div>
  );
}

function SignatureSvg() {
  return (
    <svg width="160" height="56" viewBox="0 0 160 56" style={{ flexShrink: 0 }}>
      <g stroke="#1c2540" fill="none" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
        <path d="M 4 30 C 0 8 30 2 26 20 C 24 32 4 30 10 38 L 8 46" />
        <path d="M 10 34 C 20 28 34 38 48 26 C 62 14 74 38 88 24 C 100 14 112 42 128 28" />
        <path d="M 128 28 L 144 28" />
      </g>
      <circle cx="150" cy="28" r="1.6" fill="#1c2540" />
      <path d="M 2 50 C 44 46 104 54 154 44" stroke="#1c2540" strokeWidth="0.6" fill="none" opacity="0.6" />
    </svg>
  );
}

function StampSvg() {
  // 84x84 = roughly the same proportional weight as in the PDF (~21% width of page)
  const SIZE = 84;
  const CX = SIZE / 2;
  const R = SIZE / 2 - 4;
  return (
    <svg
      width={SIZE}
      height={SIZE}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      style={{ flexShrink: 0, transform: "rotate(-8deg)" }}
    >
      <g stroke="#9f7aea" fill="none">
        <circle cx={CX} cy={CX} r={R} strokeWidth="1.6" opacity="0.92" />
        <circle cx={CX} cy={CX} r={R - 3} strokeWidth="0.4" opacity="0.55" />
      </g>
      {/* tv icon */}
      <g
        transform={`translate(${CX - 12}, ${CX - 24})`}
        stroke="#9f7aea"
        fill="none"
        strokeWidth="0.8"
        strokeLinecap="round"
      >
        <line x1="12" y1="6" x2="4" y2="0" />
        <line x1="12" y1="6" x2="20" y2="0" />
        <circle cx="4" cy="0" r="0.6" fill="#9f7aea" />
        <circle cx="20" cy="0" r="0.6" fill="#9f7aea" />
        <rect x="0" y="6" width="24" height="14" rx="2.5" strokeWidth="1" />
        <circle cx="20.5" cy="17.5" r="0.6" fill="#9f7aea" opacity="0.7" />
        <line x1="6" y1="20" x2="4" y2="24" />
        <line x1="18" y1="20" x2="20" y2="24" />
      </g>
      <text
        x="50%"
        y="56%"
        textAnchor="middle"
        fontFamily="'JetBrains Mono', monospace"
        fontWeight="700"
        fontSize="8"
        fill="#9f7aea"
        letterSpacing="0.8"
      >
        PARAMAXA
      </text>
      <text
        x="50%"
        y="63%"
        textAnchor="middle"
        fontFamily="'JetBrains Mono', monospace"
        fontSize="4"
        fill="#9f7aea"
        opacity="0.7"
      >
        . . . . .
      </text>
      <text
        x="50%"
        y="70%"
        textAnchor="middle"
        fontFamily="'JetBrains Mono', monospace"
        fontWeight="700"
        fontSize="4.5"
        letterSpacing="1.6"
        fill="#9f7aea"
        opacity="0.85"
      >
        EST 2023
      </text>
    </svg>
  );
}
