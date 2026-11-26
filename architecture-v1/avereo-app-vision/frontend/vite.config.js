import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import { OPTIONS_PWA } from "./pwa.config.js";
import { boucleLocaleSeulement } from "./vite-plugins/boucle-locale.js";

// En développement, l'API PHP locale (local/vision-local.ps1 up) est jointe par le même site : /api/… et /connect/…
const API_LOCALE = "http://127.0.0.1:8110";

export default defineConfig({
  // Vision est publiée à la racine ; conserver /account-menu.js dans le livrable.
  base: "/",
  // Application installable et service worker (R09, fin de R04) : voir pwa.config.js.
  plugins: [react(), boucleLocaleSeulement(), VitePWA(OPTIONS_PWA)],
  server: {
    proxy: {
      "/api": { target: API_LOCALE, changeOrigin: true },
      "/connect": { target: API_LOCALE, changeOrigin: true },
    },
  },
});
