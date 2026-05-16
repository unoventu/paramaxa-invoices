// Browser PDF renderer. Uses pdfkit standalone build + blob-stream.
// Shares the document layout with the Node test script via pdf-builder.

import PDFDocument from "pdfkit/js/pdfkit.standalone";
import type { Invoice } from "./types";
import { MARGIN, PAGE_H, PAGE_W, renderInvoice, type PdfDoc } from "./pdf-builder";

let fontBuffersPromise: Promise<{ regular: ArrayBuffer; bold: ArrayBuffer }> | null = null;

async function fetchFonts(): Promise<{ regular: ArrayBuffer; bold: ArrayBuffer }> {
  if (fontBuffersPromise) return fontBuffersPromise;
  const base = `${import.meta.env.BASE_URL ?? "/"}fonts/`.replace(/\/+/g, "/");
  fontBuffersPromise = (async () => {
    const [regular, bold] = await Promise.all([
      fetch(`${base}JetBrainsMono-Regular.ttf`).then((r) => {
        if (!r.ok) throw new Error(`font fetch failed: ${r.status}`);
        return r.arrayBuffer();
      }),
      fetch(`${base}JetBrainsMono-Bold.ttf`).then((r) => {
        if (!r.ok) throw new Error(`font fetch failed: ${r.status}`);
        return r.arrayBuffer();
      }),
    ]);
    return { regular, bold };
  })();
  return fontBuffersPromise;
}

async function buildDoc(invoice: Invoice): Promise<Blob> {
  const { regular, bold } = await fetchFonts();

  const doc = new PDFDocument({ size: [PAGE_W, PAGE_H], margin: MARGIN });
  doc.registerFont("Mono", regular);
  doc.registerFont("MonoBold", bold);

  const chunks: Uint8Array[] = [];
  return new Promise<Blob>((resolve, reject) => {
    const emitter = doc as unknown as {
      on(event: "data", cb: (chunk: Uint8Array) => void): void;
      on(event: "end", cb: () => void): void;
      on(event: "error", cb: (e: Error) => void): void;
    };
    emitter.on("data", (chunk) => chunks.push(chunk));
    emitter.on("end", () =>
      resolve(new Blob(chunks as BlobPart[], { type: "application/pdf" })),
    );
    emitter.on("error", reject);

    try {
      renderInvoice(doc as unknown as PdfDoc, invoice);
      doc.end();
    } catch (e) {
      reject(e instanceof Error ? e : new Error(String(e)));
    }
  });
}

export async function invoicePdfBlob(invoice: Invoice): Promise<Blob> {
  return buildDoc(invoice);
}

export async function downloadInvoicePdf(invoice: Invoice) {
  const blob = await buildDoc(invoice);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${invoice.number}-${invoice.clientSnapshot.name.replace(/\s+/g, "-")}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export async function openInvoicePdfInNewWindow(invoice: Invoice) {
  const blob = await buildDoc(invoice);
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
