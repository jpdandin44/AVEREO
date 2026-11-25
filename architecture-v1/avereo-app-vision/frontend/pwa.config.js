// Configuration de l'application installable (R09) et du service worker (fin de R04), lue par vite.config.js et par les tests.
// Le service worker met en cache l'APPLICATION seulement (pages, scripts, styles, polices, images) pour qu'elle s'ouvre sans réseau.
// Il ne sert ni ne met jamais en cache l'API (/api), la passerelle CONNECT (/connect) ni la page de recette locale (/revue) :
// les données restent dans le stockage local (Dexie) et sur le serveur, jamais dans le cache du navigateur.

/** Chemins jamais servis par le service worker (navigation vers le réseau). */
export const CHEMINS_EXCLUS = [/^\/api\//, /^\/connect\//, /^\/revue(\/|$)/];

export const MANIFESTE = {
  name: "AVEREO Vision",
  short_name: "Vision",
  description: "Relevé de l'existant, plan 2D et métrés pour la rénovation.",
  lang: "fr",
  dir: "ltr",
  start_url: "./",
  scope: "./",
  display: "standalone",
  orientation: "any",
  theme_color: "#002B45",
  background_color: "#FFFFFF",
  // Icônes provisoires (décision D12) : aplat bleu nuit et « V » géométrique. À VÉRIFIER : fichier logo carré.
  icons: [
    { src: "icons/icone-192.png", sizes: "192x192", type: "image/png" },
    { src: "icons/icone-512.png", sizes: "512x512", type: "image/png" },
    { src: "icons/icone-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
};

/** Options de vite-plugin-pwa. */
export const OPTIONS_PWA = {
  // Une nouvelle version est PROPOSÉE (bandeau « Recharger »), jamais imposée en plein relevé.
  registerType: "prompt",
  injectRegister: false,
  strategies: "generateSW",
  manifest: MANIFESTE,
  includeAssets: ["icons/apple-touch-icon-180.png"],
  workbox: {
    globPatterns: ["**/*.{js,css,html,png,svg,woff,woff2}"],
    globIgnores: ["api/**", "connect/**"],
    navigateFallback: "index.html",
    navigateFallbackDenylist: CHEMINS_EXCLUS,
    cleanupOutdatedCaches: true,
    // Aucune stratégie de cache à l'exécution : rien de ce qui vient de l'API n'est mis en cache.
    runtimeCaching: [],
  },
  devOptions: { enabled: false },
};
