export type Client = {
  id: string;
  name: string;
  shortCode: string;
  email?: string;
  address?: string;
  notes?: string;
  defaultAmount?: number;
  createdAt: string;
  lastInvoiceAt?: string;
  invoiceCount: number;
};

export type InvoiceLine = {
  description: string;
  amount: number;
};

export type Invoice = {
  id: string;
  number: string;
  clientId: string;
  clientSnapshot: Pick<Client, "name" | "email" | "address">;
  period?: string;
  lines: InvoiceLine[];
  currency: "ZAR";
  issuedAt: string;
  dueAt: string;
  total: number;
  status: "issued" | "paid" | "cancelled";
};

export type SettingsState = {
  nextInvoiceNumber: number;
  invoicePrefix: string;
  dueDays: number;
  defaultDescription: string;
};
