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
  platform?: string;
  ready: () => void;
  expand: () => void;
  isExpanded?: boolean;
  isVerticalSwipesEnabled?: boolean;
  disableVerticalSwipes?: () => void;
  enableClosingConfirmation?: () => void;
  requestFullscreen?: () => void;
  lockOrientation?: () => void;
  openLink?: (url: string, opts?: { try_instant_view?: boolean }) => void;
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
  // Disable Telegram's vertical swipes — they drag the WebView itself and
  // make the page look like it's "extending past" the screen when the
  // keyboard slides up. Available in Bot API 7.7+; safely ignored on older.
  tg.disableVerticalSwipes?.();
  tg.setHeaderColor?.("#08080a");
  tg.setBackgroundColor?.("#08080a");
}

// Cached after first failure so we don't spam the console with the same
// "not supported in version 6.0" warning for every tap.
let hapticBroken = false;

export function tgPlatform(): string {
  return getTG()?.platform ?? "unknown";
}

// Android Telegram WebView cannot render PDFs inside an iframe.
// iOS / Telegram Desktop / Web can.
export function canRenderPdfInIframe(): boolean {
  const p = tgPlatform();
  return p !== "android" && p !== "android_x";
}

export function openExternal(url: string) {
  const tg = getTG();
  if (tg?.openLink) {
    tg.openLink(url);
  } else {
    window.open(url, "_blank", "noopener");
  }
}

export function haptic(kind: "tap" | "ok" | "err" | "warn" = "tap") {
  if (hapticBroken) return;
  const h = getTG()?.HapticFeedback;
  if (!h) return;
  try {
    if (kind === "tap") h.impactOccurred("light");
    else if (kind === "ok") h.notificationOccurred("success");
    else if (kind === "err") h.notificationOccurred("error");
    else if (kind === "warn") h.notificationOccurred("warning");
  } catch {
    hapticBroken = true;
  }
}
