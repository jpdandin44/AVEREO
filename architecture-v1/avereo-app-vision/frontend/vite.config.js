import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { boucleLocaleSeulement } from "./vite-plugins/boucle-locale.js";

// En développement, l'API PHP locale (local/vision-local.ps1 up) est jointe par le même site : /api/… et /connect/…
const API_LOCALE = "http://127.0.0.1:8110";

export default defineConfig({
  base: "./",
  plugins: [react(), boucleLocaleSeulement()],
  server: {
    proxy: {
      "/api": { target: API_LOCALE, changeOrigin: true },
      "/connect": { target: API_LOCALE, changeOrigin: true },
    },
  },
});
