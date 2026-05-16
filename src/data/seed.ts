import type { Client } from "../lib/types";

// Hardcoded IDs — seed must survive reload without breaking invoice→client refs.
export const SEED_CLIENTS: Client[] = [
  {
    id: "seed-acme",
    name: "Acme Productions Ltd",
    shortCode: "acme",
    email: "billing@acme.tv",
    createdAt: "2026-03-12T10:00:00Z",
    lastInvoiceAt: "2026-05-01T10:00:00Z",
    invoiceCount: 3,
  },
  {
    id: "seed-beta",
    name: "Beta Broadcast Group",
    shortCode: "beta",
    email: "finance@betagroup.co.za",
    address: "12 Long Street\nCape Town 8001",
    createdAt: "2026-02-08T10:00:00Z",
    lastInvoiceAt: "2026-04-28T10:00:00Z",
    invoiceCount: 5,
    defaultAmount: 22000,
  },
  {
    id: "seed-gamma",
    name: "Gamma Media Network",
    shortCode: "gamma",
    createdAt: "2026-04-21T10:00:00Z",
    lastInvoiceAt: "2026-04-30T10:00:00Z",
    invoiceCount: 1,
  },
  {
    id: "seed-kontinental",
    name: "Kontinental TV",
    shortCode: "kont",
    email: "ap@kontinental.tv",
    createdAt: "2026-01-15T10:00:00Z",
    invoiceCount: 0,
  },
];
