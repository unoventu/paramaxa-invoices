import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "./",
  // Target older WebViews — some Android Telegram clients ship with stock
  // WebView that doesn't support newer ES syntax (logical assignment etc).
  build: {
    target: ["es2019", "chrome80", "safari14"],
  },
  server: {
    port: 5180,
    host: true,
  },
});
