import { getTG, isInTelegram } from "./tg";
import type { Client, Invoice, SettingsState } from "./types";

const KEYS = {
  clients: "paramaxa.clients.v1",
  invoices: "paramaxa.invoices.v1",
  settings: "paramaxa.settings.v1",
};

type RawStore = {
  get: (key: string) => Promise<string | null>;
  set: (key: string, value: string) => Promise<void>;
};

function localStore(): RawStore {
  return {
    get: async (key) => localStorage.getItem(key),
    set: async (key, value) => localStorage.setItem(key, value),
  };
}

function cloudStore(): RawStore | null {
  if (!isInTelegram()) return null;
  const cs = getTG()?.CloudStorage;
  if (!cs) return null;
  return {
    get: (key) =>
      new Promise((resolve) =>
        cs.getItem(key, (err, v) => resolve(err ? null : v)),
      ),
    set: (key, value) =>
      new Promise((resolve) =>
        cs.setItem(key, value, (err) => {
          if (err) console.warn("[storage] cloud set failed, mirroring to local", err);
          // Always mirror to local to survive cloud-storage hiccups
          try {
            localStorage.setItem(key, value);
          } catch {}
          resolve();
        }),
      ),
  };
}

function pickStore(): RawStore {
  return cloudStore() ?? localStore();
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await pickStore().get(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  await pickStore().set(key, JSON.stringify(value));
}

export const Storage = {
  async clients(): Promise<Client[]> {
    return readJson<Client[]>(KEYS.clients, []);
  },
  async saveClients(list: Client[]) {
    await writeJson(KEYS.clients, list);
  },
  async invoices(): Promise<Invoice[]> {
    return readJson<Invoice[]>(KEYS.invoices, []);
  },
  async saveInvoices(list: Invoice[]) {
    await writeJson(KEYS.invoices, list);
  },
  async settings(): Promise<SettingsState> {
    return readJson<SettingsState>(KEYS.settings, {
      nextInvoiceNumber: 88,
      invoicePrefix: "PMX",
      dueDays: 14,
      defaultDescription: "television broadcasting services",
    });
  },
  async saveSettings(s: SettingsState) {
    await writeJson(KEYS.settings, s);
  },
  async exportAll() {
    return {
      clients: await this.clients(),
      invoices: await this.invoices(),
      settings: await this.settings(),
      exportedAt: new Date().toISOString(),
    };
  },
};
