// Renderer for the PARAMAXA invoice. Uses pdfkit primitives only, so the same
// function works inside both Node (scripts/test-pdf.ts) and the browser
// (src/lib/pdf.ts via pdfkit/js/pdfkit.standalone).

import type { Invoice } from "./types";

const VIOLET = "#b794f4";
const FG = "#0a0a0c";
const DIM = "#8a8a96";
const FAINT = "#bcbcc6";
const MINT = "#34a169";

export const PAGE_W = 400;
export const PAGE_H = 720;
export const MARGIN = 24;
const CONTENT_W = PAGE_W - MARGIN * 2;

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

function fmtZAR(n: number): string {
  const [int, dec] = n.toFixed(2).split(".");
  return `R ${int.replace(/\B(?=(\d{3})+(?!\d))/g, " ")}.${dec}`;
}

function fmtDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  return `${day} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

// Minimal pdfkit document surface we actually use — keeps the renderer
// portable between the standalone browser build and the Node build.
export type PdfDoc = {
  font(name: string): PdfDoc;
  fontSize(size: number): PdfDoc;
  fillColor(color: string, opacity?: number): PdfDoc;
  strokeColor(color: string, opacity?: number): PdfDoc;
  lineWidth(w: number): PdfDoc;
  opacity(o: number): PdfDoc;
  lineJoin(style: string): PdfDoc;
  lineCap(style: string): PdfDoc;
  text(text: string, x?: number, y?: number, opts?: Record<string, unknown>): PdfDoc;
  moveDown(lines?: number): PdfDoc;
  moveTo(x: number, y: number): PdfDoc;
  lineTo(x: number, y: number): PdfDoc;
  bezierCurveTo(c1x: number, c1y: number, c2x: number, c2y: number, x: number, y: number): PdfDoc;
  stroke(): PdfDoc;
  fill(): PdfDoc;
  circle(x: number, y: number, r: number): PdfDoc;
  roundedRect(x: number, y: number, w: number, h: number, r: number): PdfDoc;
  save(): PdfDoc;
  restore(): PdfDoc;
  translate(x: number, y: number): PdfDoc;
  rotate(angle: number): PdfDoc;
  widthOfString(s: string): number;
  x: number;
  y: number;
};

function repeat(ch: string, n: number) {
  return ch.repeat(Math.max(0, n));
}

export function renderInvoice(doc: PdfDoc, inv: Invoice) {
  // measure mono glyph width once
  doc.font("Mono").fontSize(9);
  const GLYPH_W = doc.widthOfString("M");
  const COLS = Math.floor(CONTENT_W / GLYPH_W);

  const hr = (ch: string, color = FAINT) => {
    doc.font("Mono").fontSize(9).fillColor(color).text(repeat(ch, COLS));
  };
  const gap = (h = 6) => {
    doc.moveDown(h / 9);
  };
  const sectionTitle = (label: string) => {
    const prefix = `── ${label} `;
    const tail = repeat("─", COLS - prefix.length);
    doc.font("Mono").fontSize(9).fillColor(DIM).text(prefix + tail);
  };
  const row = (label: string, value: string, color = FG) => {
    const dotsCount = Math.max(3, COLS - label.length - value.length - 2);
    doc.font("Mono").fontSize(9).fillColor(color).text(`${label} ${".".repeat(dotsCount)} ${value}`);
  };
  const plain = (text: string, color = FG, size = 9, bold = false) => {
    doc.font(bold ? "MonoBold" : "Mono").fontSize(size).fillColor(color).text(text);
  };

  // ── header ─────────────────────────────────────────────────────────────
  hr("═", VIOLET);
  gap(4);
  const headerY = doc.y;
  doc.font("MonoBold").fontSize(20).fillColor(FG)
    .text("PARAMAXA", MARGIN, headerY, { characterSpacing: 1.5 });
  doc.font("MonoBold").fontSize(11).fillColor(VIOLET)
    .text("invoice", MARGIN, headerY + 6, { width: CONTENT_W, align: "right" });
  doc.font("Mono").fontSize(8).fillColor(DIM)
    .text("(Pty) Ltd · Cape Town · South Africa", MARGIN, headerY + 24);
  doc.font("Mono").fontSize(10).fillColor(VIOLET)
    .text(inv.number, MARGIN, headerY + 22, { width: CONTENT_W, align: "right" });
  doc.y = headerY + 40;
  doc.x = MARGIN;
  hr("═", VIOLET);
  gap(8);

  // ── meta ───────────────────────────────────────────────────────────────
  row("issued", fmtDate(inv.issuedAt));
  row("due", fmtDate(inv.dueAt));
  if (inv.period) row("period", inv.period);
  gap(6);

  // ── bill to ────────────────────────────────────────────────────────────
  sectionTitle("bill to");
  gap(2);
  plain(`  ${inv.clientSnapshot.name}`);
  if (inv.clientSnapshot.email) plain(`  ${inv.clientSnapshot.email}`);
  if (inv.clientSnapshot.address) {
    inv.clientSnapshot.address.split("\n").forEach((line) => plain(`  ${line}`));
  }
  gap(8);

  // ── description ────────────────────────────────────────────────────────
  const descLabel = "── description ";
  const amtTail = " amount (zar) ───";
  const mid = COLS - descLabel.length - amtTail.length;
  plain(descLabel + repeat("─", mid) + amtTail, DIM);
  gap(2);
  inv.lines.forEach((l) => {
    const left = `  ${l.description}`;
    const right = fmtZAR(l.amount);
    const pad = Math.max(4, COLS - left.length - right.length);
    plain(left + " ".repeat(pad) + right);
  });
  gap(8);

  // ── total ──────────────────────────────────────────────────────────────
  sectionTitle("total");
  gap(2);
  const labelW = 90;
  const gapW = 10;
  const valueW = 90;
  const blockW = labelW + gapW + valueW;
  const labelX = MARGIN + CONTENT_W - blockW;
  const valueX = MARGIN + CONTENT_W - valueW;
  const y1 = doc.y;
  doc.font("Mono").fontSize(9).fillColor(FG)
    .text("subtotal", labelX, y1, { width: labelW, align: "right" });
  doc.font("Mono").fontSize(9).fillColor(FG)
    .text(fmtZAR(inv.total), valueX, y1, { width: valueW, align: "right" });
  const y2 = y1 + 14;
  doc.font("MonoBold").fontSize(10).fillColor("#6b46c1")
    .text("total due", labelX, y2, { width: labelW, align: "right" });
  doc.font("MonoBold").fontSize(10).fillColor("#6b46c1")
    .text(fmtZAR(inv.total), valueX, y2, { width: valueW, align: "right" });
  doc.x = MARGIN;
  doc.y = y2 + 16;
  gap(8);

  // ── banking ────────────────────────────────────────────────────────────
  sectionTitle("banking details");
  gap(2);
  plain("  beneficiary ......... Paramaxa (Pty) Ltd");
  plain("  bank ................ First National Bank (FNB)");
  plain("  account number ...... 63066403783");
  plain("  branch .............. Greenpoint");
  plain("  branch code ......... 210651");
  gap(10);

  hr("─", FAINT);
  gap(4);
  plain(`  Payment due by ${fmtDate(inv.dueAt)}.`);
  plain(`  Please use ${inv.number} as payment reference.`, MINT);
  plain("  Issued in Cape Town · South Africa.", DIM);
  gap(8);

  // ── signature + stamp ──────────────────────────────────────────────────
  const sealY = doc.y + 8;
  drawSignature(doc, MARGIN + 6, sealY + 8);
  doc.font("Mono").fontSize(7.5).fillColor(DIM)
    .text("Authorised signature", MARGIN + 6, sealY + 48, { width: 140 });
  doc.font("Mono").fontSize(6.5).fillColor(FAINT)
    .text("Paramaxa (Pty) Ltd", MARGIN + 6, sealY + 58, { width: 140 });
  drawStamp(doc, MARGIN + CONTENT_W - 48, sealY + 28, 42, -8);

  doc.x = MARGIN;
  doc.y = sealY + 90;
  gap(2);
  plain("  > thank_you_", VIOLET, 10);
  gap(8);
  hr("═", VIOLET);
}

// ── stamp ────────────────────────────────────────────────────────────────
function drawStamp(d: PdfDoc, cx: number, cy: number, r: number, rotateDeg: number) {
  d.save();
  d.translate(cx, cy);
  d.rotate(rotateDeg);

  d.lineWidth(1.6).strokeColor(VIOLET).opacity(0.92).circle(0, 0, r).stroke();
  d.lineWidth(0.4).strokeColor(VIOLET).opacity(0.55).circle(0, 0, r - 3).stroke();

  const boxW = 2 * (r - 11);
  const boxX = -(r - 11);

  const iconW = r * 0.46;
  const iconH = r * 0.32;
  drawTvIcon(d, -iconW / 2, -r * 0.62, iconW, iconH);

  d.font("MonoBold").fontSize(8).fillColor(VIOLET).opacity(0.95)
    .text("PARAMAXA", boxX, -3, {
      lineBreak: false,
      width: boxW,
      align: "center",
      characterSpacing: 0.8,
    });

  d.font("Mono").fontSize(4).fillColor(VIOLET).opacity(0.55)
    .text(". . . . .", boxX, 9, {
      lineBreak: false,
      width: boxW,
      align: "center",
    });

  d.font("MonoBold").fontSize(5).fillColor(VIOLET).opacity(0.85)
    .text("EST 2023", boxX, 17, {
      lineBreak: false,
      width: boxW,
      align: "center",
      characterSpacing: 1.6,
    });

  d.opacity(1);
  d.restore();
}

function drawTvIcon(d: PdfDoc, x: number, y: number, w: number, h: number) {
  d.save();
  d.strokeColor(VIOLET).fillColor(VIOLET).opacity(0.95).lineWidth(0.9)
    .lineJoin("round").lineCap("round");

  const cx = x + w / 2;
  const screenTop = y + h * 0.22;
  const antH = h * 0.55;
  const antSpread = w * 0.32;
  d.moveTo(cx, screenTop).lineTo(cx - antSpread, screenTop - antH).stroke();
  d.moveTo(cx, screenTop).lineTo(cx + antSpread, screenTop - antH).stroke();
  d.circle(cx - antSpread, screenTop - antH, 0.6).fill();
  d.circle(cx + antSpread, screenTop - antH, 0.6).fill();

  const sw = w;
  const sh = h * 0.62;
  const rr = Math.min(sw, sh) * 0.18;
  d.lineWidth(1.0).roundedRect(x, screenTop, sw, sh, rr).stroke();

  d.opacity(0.7).circle(x + sw - rr * 0.7, screenTop + sh - rr * 0.7, 0.55).fill();
  d.opacity(0.95);

  const legY1 = screenTop + sh;
  const legY2 = screenTop + sh + h * 0.16;
  const legInset = sw * 0.22;
  const legSplay = sw * 0.06;
  d.lineWidth(0.9);
  d.moveTo(x + legInset, legY1).lineTo(x + legInset - legSplay, legY2).stroke();
  d.moveTo(x + sw - legInset, legY1).lineTo(x + sw - legInset + legSplay, legY2).stroke();

  d.opacity(1);
  d.restore();
}

function drawSignature(d: PdfDoc, x: number, y: number) {
  d.save();
  d.translate(x, y);
  d.strokeColor("#1c2540").lineWidth(1.4).opacity(0.92);
  d.moveTo(0, 14)
    .bezierCurveTo(-4, -8, 26, -14, 22, 4)
    .bezierCurveTo(20, 16, 0, 14, 6, 22)
    .lineTo(4, 30);
  d.moveTo(6, 18)
    .bezierCurveTo(16, 12, 30, 22, 44, 10)
    .bezierCurveTo(58, -2, 70, 22, 84, 8)
    .bezierCurveTo(96, -2, 108, 26, 124, 12);
  d.moveTo(124, 12).lineTo(140, 12);
  d.stroke();
  d.fillColor("#1c2540").circle(146, 12, 1.5).fill();
  d.strokeColor("#1c2540").lineWidth(0.6).opacity(0.6);
  d.moveTo(-2, 34)
    .bezierCurveTo(40, 30, 100, 38, 150, 28)
    .stroke();
  d.opacity(1);
  d.restore();
}
