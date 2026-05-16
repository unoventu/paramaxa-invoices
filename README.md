# paramaxa · invoices

Telegram Mini App for issuing invoices from **PARAMAXA (PTY) LTD**.
Closed-circle tool — single user, allowlisted by Telegram ID.

## what it does

- one-tap invoice for the typical service (`television broadcasting services — <month>`)
- custom multi-line invoices with picker
- client database (search, edit, default amount)
- terminal-style PDF in JetBrains Mono with **ZAR** currency and FNB banking details
- offline data in Telegram CloudStorage (mirrors to localStorage as fallback)
- starts at invoice **PMX-0088**, no year reset

## run locally

```bash
bun install
bun dev
```

Open <http://localhost:5180/>. Outside Telegram the app marks itself **dev** in the top bar.

## lock to your telegram id

Edit `src/lib/access.ts`:

```ts
export const ALLOWED_USER_IDS: number[] = [123456789];
```

Find your numeric Telegram user ID via any "@userinfobot"-style bot, or temporarily expose `tg.initDataUnsafe.user.id` in dev. While the array is empty the app shows "unlocked" — that's a reminder, not a security feature.

## connect to bot (one-time)

In [@BotFather](https://t.me/BotFather):
1. `/mybots` → pick `@Paramaxabot` → **Bot Settings** → **Menu Button** → **Configure menu button**
2. paste the deployed URL (GitHub Pages once published)
3. set label e.g. `📄 invoices`

The bot token never appears in this repo — Mini Apps don't need it.

## deploy

The repo is static. Push to GitHub, enable Pages from `dist/` after `bun run build`, or wire up GitHub Actions.

## reset local state

In DevTools console: `localStorage.clear(); location.reload()`

## stack

| | |
| --- | --- |
| build | vite 8 + react 19 + ts |
| style | tailwind v4 (`@theme` design tokens) |
| motion | motion (framer) |
| pdf | pdfmake + bundled JetBrains Mono TTF |
| storage | tg `CloudStorage` ▸ `localStorage` fallback |
