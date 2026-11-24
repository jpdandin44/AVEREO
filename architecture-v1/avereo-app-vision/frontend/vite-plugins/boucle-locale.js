// Plugin Vite (développement seulement) : le proxy vers l'API locale n'accepte que les requêtes venant de cette machine.
// Pourquoi : le jeton de test est dans le bundle servi par `npm run dev`. Avec `npm run dev -- --host` (test sur un
// smartphone), un autre appareil du réseau pourrait obtenir ce bundle ; ses appels vers /api et /connect sont refusés ici,
// donc le jeton ne lui sert à rien. Ne jamais mettre de vrais relevés dans la base locale.

const ADRESSES_LOCALES = new Set(["127.0.0.1", "::1", "::ffff:127.0.0.1"]);
const PREFIXES_PROTEGES = ["/api", "/connect"];

/** @param {string | undefined} adresse @returns {boolean} */
export function adresseEstLocale(adresse) {
  return typeof adresse === "string" && ADRESSES_LOCALES.has(adresse);
}

/** Intergiciel Connect : 403 pour toute requête vers l'API qui ne vient pas de la boucle locale. */
export function filtreBoucleLocale(req, res, suivant) {
  const chemin = String(req.url ?? "");
  const protege = PREFIXES_PROTEGES.some((p) => chemin === p || chemin.startsWith(`${p}/`) || chemin.startsWith(`${p}?`));
  if (protege && !adresseEstLocale(req.socket?.remoteAddress)) {
    res.statusCode = 403;
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("L'API locale n'est accessible que depuis cette machine.");
    return;
  }
  suivant();
}

/** @returns {import("vite").Plugin} */
export function boucleLocaleSeulement() {
  return {
    name: "vision-boucle-locale",
    apply: "serve",
    configureServer(serveur) {
      // inséré avant les autres intergiciels, donc avant le proxy
      serveur.middlewares.use(filtreBoucleLocale);
    },
  };
}
