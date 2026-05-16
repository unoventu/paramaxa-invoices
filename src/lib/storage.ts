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

// Once Cloud proves broken (timeout or sync throw), we stop trying it
// for the rest of the session and use localStorage exclusively.
let cloudBroken = false;
const CLOUD_TIMEOUT_MS = 1500;

function cloudStore(): RawStore | null {
  if (cloudBroken) return null;
  if (!isInTelegram()) return null;
  const cs = getTG()?.CloudStorage;
  if (!cs) return null;

  const withTimeout = <T,>(fn: (resolve: (v: T) => void, reject: (e: unknown) => void) => void): Promise<T> =>
    new Promise<T>((resolve, reject) => {
      const t = setTimeout(() => {
        cloudBroken = true;
        console.warn("[storage] cloud timed out, falling back to localStorage");
        reject(new Error("cloud timeout"));
      }, CLOUD_TIMEOUT_MS);
      try {
        fn(
          (v) => {
            clearTimeout(t);
            resolve(v);
          },
          (e) => {
            clearTimeout(t);
            cloudBroken = true;
            reject(e);
          },
        );
      } catch (e) {
        clearTimeout(t);
        cloudBroken = true;
        reject(e);
      }
    });

  return {
    get: (key) =>
      withTimeout<string | null>((resolve) =>
        cs.getItem(key, (err, v) => resolve(err ? null : v)),
      ).catch(() => null),
    set: (key, value) =>
      withTimeout<void>((resolve) =>
        cs.setItem(key, value, () => {
          try {
            localStorage.setItem(key, value);
          } catch {}
          resolve();
        }),
      ).catch(() => {
        // Mirror to local even on cloud failure so data survives
        try {
          localStorage.setItem(key, value);
        } catch {}
      }),
  };
}

async function readJson<T>(key: string, fallback: T): Promise<T> {
  // Try cloud first, with timeout. On miss/fail/null — fall back to local.
  const cloud = cloudStore();
  if (cloud) {
    try {
      const raw = await cloud.get(key);
      if (raw) return JSON.parse(raw) as T;
    } catch {
      // cloudBroken flag is already set inside withTimeout
    }
  }
  try {
    const raw = await localStore().get(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(key: string, value: unknown): Promise<void> {
  const json = JSON.stringify(value);
  // Always write to localStorage (cheap, sync, always works in WebView)
  try {
    localStorage.setItem(key, json);
  } catch {}
  // Best-effort cloud mirror, never blocks the caller for long.
  const cloud = cloudStore();
  if (cloud) {
    cloud.set(key, json).catch(() => {});
  }
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
