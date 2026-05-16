// Minimal typing of the Telegram WebApp surface we use.
type TGCloudStorage = {
  getItem: (key: string, cb: (err: Error | null, value: string | null) => void) => void;
  setItem: (key: string, value: string, cb?: (err: Error | null, ok: boolean) => void) => void;
  removeItem: (key: string, cb?: (err: Error | null, ok: boolean) => void) => void;
  getKeys: (cb: (err: Error | null, keys: string[]) => void) => void;
};

type TGWebApp = {
  initData: string;
  initDataUnsafe?: { user?: { id: number; first_name?: string; username?: string } };
  ready: () => void;
  expand: () => void;
  colorScheme: "light" | "dark";
  themeParams: Record<string, string>;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  CloudStorage?: TGCloudStorage;
  HapticFeedback?: {
    impactOccurred: (style: "light" | "medium" | "heavy" | "rigid" | "soft") => void;
    notificationOccurred: (type: "error" | "success" | "warning") => void;
    selectionChanged: () => void;
  };
  MainButton?: {
    text: string;
    setText: (text: string) => void;
    show: () => void;
    hide: () => void;
    enable: () => void;
    disable: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
    setParams: (params: { color?: string; text_color?: string; is_active?: boolean }) => void;
  };
  BackButton?: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
    offClick: (cb: () => void) => void;
  };
};

declare global {
  interface Window {
    Telegram?: { WebApp?: TGWebApp };
  }
}

export function getTG(): TGWebApp | null {
  return typeof window !== "undefined" ? (window.Telegram?.WebApp ?? null) : null;
}

export function isInTelegram(): boolean {
  return !!getTG()?.initData;
}

export function tgReady() {
  const tg = getTG();
  if (!tg) return;
  tg.ready();
  tg.expand();
  tg.setHeaderColor?.("#08080a");
  tg.setBackgroundColor?.("#08080a");
}

export function haptic(kind: "tap" | "ok" | "err" | "warn" = "tap") {
  const h = getTG()?.HapticFeedback;
  if (!h) return;
  if (kind === "tap") h.impactOccurred("light");
  if (kind === "ok") h.notificationOccurred("success");
  if (kind === "err") h.notificationOccurred("error");
  if (kind === "warn") h.notificationOccurred("warning");
}
