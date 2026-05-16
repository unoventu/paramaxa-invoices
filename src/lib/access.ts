import { getTG, isInTelegram } from "./tg";

// Hard allowlist: only these Telegram user IDs can use the app inside Telegram.
// 0 = "not configured yet — accept any user on first launch and prompt to lock".
// Replace with your real numeric Telegram user ID before deploying.
export const ALLOWED_USER_IDS: number[] = [288813512, 6490527884];

export type AccessState =
  | { kind: "dev" } // running outside Telegram (local browser)
  | { kind: "allowed"; userId: number; username?: string }
  | { kind: "unconfigured"; userId: number; username?: string } // no allowlist yet
  | { kind: "denied"; userId: number };

export function checkAccess(): AccessState {
  if (!isInTelegram()) return { kind: "dev" };

  const tg = getTG()!;
  const user = tg.initDataUnsafe?.user;
  if (!user) return { kind: "denied", userId: 0 };

  if (ALLOWED_USER_IDS.length === 0) {
    return { kind: "unconfigured", userId: user.id, username: user.username };
  }

  if (ALLOWED_USER_IDS.includes(user.id)) {
    return { kind: "allowed", userId: user.id, username: user.username };
  }

  return { kind: "denied", userId: user.id };
}
