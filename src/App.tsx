import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Storage } from "./lib/storage";
import { checkAccess, type AccessState } from "./lib/access";
import { tgReady } from "./lib/tg";
import type { Client, Invoice, SettingsState } from "./lib/types";
import { SEED_CLIENTS } from "./data/seed";
import { HomeScreen } from "./screens/HomeScreen";
import { NewInvoiceScreen } from "./screens/NewInvoiceScreen";
import { ClientsScreen } from "./screens/ClientsScreen";
import { HistoryScreen } from "./screens/HistoryScreen";
import { TopBar } from "./components/TopBar";
import { TabBar } from "./components/TabBar";

export type Screen = "home" | "new" | "clients" | "history";

export default function App() {
  const [access, setAccess] = useState<AccessState | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [settings, setSettings] = useState<SettingsState | null>(null);

  const [screen, setScreen] = useState<Screen>("home");
  const [preselectClientId, setPreselectClientId] = useState<string | undefined>();
  const [quickMode, setQuickMode] = useState(false);

  useEffect(() => {
    tgReady();
    setAccess(checkAccess());

    (async () => {
      const [c, inv, s] = await Promise.all([
        Storage.clients(),
        Storage.invoices(),
        Storage.settings(),
      ]);
      if (c.length === 0) {
        await Storage.saveClients(SEED_CLIENTS);
        setClients(SEED_CLIENTS);
      } else {
        setClients(c);
      }
      setInvoices(inv);
      setSettings(s);
      setLoaded(true);
    })();
  }, []);

  async function saveClient(c: Client) {
    const exists = clients.some((x) => x.id === c.id);
    const next = exists ? clients.map((x) => (x.id === c.id ? c : x)) : [c, ...clients];
    setClients(next);
    await Storage.saveClients(next);
  }

  async function deleteClient(id: string) {
    const next = clients.filter((x) => x.id !== id);
    setClients(next);
    await Storage.saveClients(next);
  }

  async function saveInvoice(inv: Invoice) {
    const next = [inv, ...invoices];
    setInvoices(next);
    await Storage.saveInvoices(next);
    // bump client stats
    const cl = clients.find((c) => c.id === inv.clientId);
    if (cl) {
      const updated: Client = {
        ...cl,
        invoiceCount: cl.invoiceCount + 1,
        lastInvoiceAt: inv.issuedAt,
      };
      await saveClient(updated);
    }
  }

  async function advanceInvoiceNumber() {
    if (!settings) return;
    const next: SettingsState = { ...settings, nextInvoiceNumber: settings.nextInvoiceNumber + 1 };
    setSettings(next);
    await Storage.saveSettings(next);
  }

  function startQuickTV() {
    setPreselectClientId(undefined);
    setQuickMode(true);
    setScreen("new");
  }

  function startWithClient(clientId: string) {
    setPreselectClientId(clientId);
    setQuickMode(false);
    setScreen("new");
  }

  function backToHome() {
    setPreselectClientId(undefined);
    setQuickMode(false);
    setScreen("home");
  }

  if (!access) return <FullScreenSpinner label="boot" />;

  if (access.kind === "denied") {
    return <AccessDenied userId={access.userId} />;
  }

  if (!loaded || !settings) return <FullScreenSpinner label="loading state" />;

  return (
    <div className="min-h-dvh flex flex-col text-[14px]">
      <TopBar
        back={
          screen !== "home"
            ? () => {
                backToHome();
              }
            : undefined
        }
        title={screen === "home" ? "paramaxa" : `paramaxa / ${screen}`}
        right={
          access.kind === "unconfigured" ? (
            <span className="text-[9px] text-[var(--color-amber)] tracking-wider">unlocked</span>
          ) : access.kind === "dev" ? (
            <span className="text-[9px] text-[var(--color-fg-3)] tracking-wider">dev</span>
          ) : null
        }
      />

      <main className="flex-1 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={screen + (preselectClientId ?? "")}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
          >
            {screen === "home" && (
              <HomeScreen
                clients={clients}
                invoices={invoices}
                settings={settings}
                onPickQuickTV={startQuickTV}
                onPickClient={startWithClient}
                onGoNew={() => setScreen("new")}
              />
            )}

            {screen === "new" && (
              <NewInvoiceScreen
                clients={clients}
                settings={settings}
                preselectClientId={preselectClientId}
                quickMode={quickMode}
                onSaveInvoice={saveInvoice}
                onSaveClient={saveClient}
                onAdvanceNumber={advanceInvoiceNumber}
                onCancel={backToHome}
              />
            )}

            {screen === "clients" && (
              <ClientsScreen clients={clients} onSave={saveClient} onDelete={deleteClient} />
            )}

            {screen === "history" && <HistoryScreen invoices={invoices} />}
          </motion.div>
        </AnimatePresence>
      </main>

      <TabBar current={screen} onChange={(s) => setScreen(s)} />
    </div>
  );
}

function FullScreenSpinner({ label }: { label: string }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-2 text-[var(--color-violet)]">
      <div className="text-[11px] tracking-widest opacity-60">/{label}</div>
      <div className="text-[28px] blink leading-none">_</div>
    </div>
  );
}

function AccessDenied({ userId }: { userId: number }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-3 p-6 text-center">
      <div className="text-[11px] tracking-widest text-[var(--color-rose)]">/access · denied</div>
      <h1 className="text-[22px] font-medium">this terminal is private</h1>
      <p className="text-[12px] text-[var(--color-fg-2)] max-w-sm">
        your telegram id <span className="text-[var(--color-rose)]">{userId}</span> is not on
        the allowlist.
      </p>
    </div>
  );
}
