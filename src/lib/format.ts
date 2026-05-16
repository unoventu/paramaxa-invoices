export const MONTHS = [
  "january",
  "february",
  "march",
  "april",
  "may",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
];

export function fmtZAR(amount: number): string {
  const fixed = amount.toFixed(2);
  const [int, dec] = fixed.split(".");
  const withSep = int.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `R ${withSep}.${dec}`;
}

export function fmtDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, "0");
  const m = MONTHS[d.getMonth()];
  return `${day} ${m} ${d.getFullYear()}`;
}

export function currentPeriod(): string {
  const d = new Date();
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function shiftPeriod(period: string, delta: number): string {
  const [m, y] = period.split(" ");
  const monthIdx = MONTHS.indexOf(m);
  const date = new Date(Number(y), monthIdx + delta, 1);
  return `${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}

export function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export function formatInvoiceNumber(prefix: string, n: number): string {
  return `${prefix}-${String(n).padStart(4, "0")}`;
}

export function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 16) || "client";
}

export function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}
