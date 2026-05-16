// Local test harness: regenerates a sample PDF on disk using the SAME
// renderInvoice() that the browser Mini App calls. Run with `bun run scripts/test-pdf.ts`.

import fs from "node:fs";
import path from "node:path";
import PDFDocument from "pdfkit";
import { MARGIN, PAGE_H, PAGE_W, renderInvoice, type PdfDoc } from "../src/lib/pdf-builder";
import type { Invoice } from "../src/lib/types";

const FONT_DIR = path.resolve(import.meta.dirname, "..", "public", "fonts");
const OUT_DIR = path.resolve(import.meta.dirname, "..", "out");
fs.mkdirSync(OUT_DIR, { recursive: true });

const invoice: Invoice = {
  id: "test",
  number: "PMX-0088",
  clientId: "test-client",
  clientSnapshot: { name: "Acme Productions Ltd", email: "billing@acme.tv" },
  period: "May 2026",
  lines: [{ description: "Television broadcasting services — May 2026", amount: 22500 }],
  currency: "ZAR",
  issuedAt: "2026-05-15T10:00:00Z",
  dueAt: "2026-05-29T10:00:00Z",
  total: 22500,
  status: "issued",
};

const doc = new PDFDocument({ size: [PAGE_W, PAGE_H], margin: MARGIN });
const out = fs.createWriteStream(path.join(OUT_DIR, `${invoice.number}-test.pdf`));
doc.pipe(out);

doc.registerFont("Mono", path.join(FONT_DIR, "JetBrainsMono-Regular.ttf"));
doc.registerFont("MonoBold", path.join(FONT_DIR, "JetBrainsMono-Bold.ttf"));

renderInvoice(doc as unknown as PdfDoc, invoice);

doc.end();

out.on("finish", () => {
  const outPath = path.join(OUT_DIR, `${invoice.number}-test.pdf`);
  const bytes = fs.statSync(outPath).size;
  console.log(`✓ wrote ${outPath} (${bytes} bytes)`);
});
out.on("error", (e) => {
  console.error("write error:", e);
  process.exit(1);
});
