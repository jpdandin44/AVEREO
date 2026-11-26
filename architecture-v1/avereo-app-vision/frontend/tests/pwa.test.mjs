// Application installable (R09) et service worker (R04) : manifeste et règles de cache.
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { CHEMINS_EXCLUS, MANIFESTE, OPTIONS_PWA } from "../pwa.config.js";

const exclu = (chemin) => CHEMINS_EXCLUS.some((motif) => motif.test(chemin));

test("R09 : manifeste complet pour l'installation (nom, affichage plein écran, couleurs de la charte, icônes 192 et 512 dont une maskable)", () => {
  assert.equal(MANIFESTE.name, "AVEREO Vision");
  assert.equal(MANIFESTE.short_name, "Vision");
  assert.equal(MANIFESTE.lang, "fr");
  assert.equal(MANIFESTE.display, "standalone");
  assert.equal(MANIFESTE.start_url, "./");
  assert.equal(MANIFESTE.scope, "./");
  assert.equal(MANIFESTE.theme_color, "#002B45", "bleu nuit de la charte");
  assert.equal(MANIFESTE.background_color, "#FFFFFF");
  const tailles = MANIFESTE.icons.map((i) => i.sizes);
  assert.ok(tailles.includes("192x192") && tailles.includes("512x512"));
  assert.ok(MANIFESTE.icons.some((i) => i.purpose === "maskable" && i.sizes === "512x512"));
});

test("R09 : chaque icône déclarée existe dans public/, ainsi que l'icône iOS", () => {
  for (const icone of [...MANIFESTE.icons.map((i) => i.src), ...OPTIONS_PWA.includeAssets]) {
    assert.ok(fs.existsSync(new URL(`../public/${icone}`, import.meta.url)), `${icone} manquante (lancer node scripts/icones-provisoires.mjs)`);
  }
});

test("R04/R08 : le service worker ne sert ni ne met en cache l'API, la passerelle CONNECT ni la page de recette", () => {
  for (const chemin of ["/api/sync.php", "/api/projects.php", "/connect/entry.php", "/revue", "/revue/"]) assert.ok(exclu(chemin), chemin);
  for (const chemin of ["/", "/index.html", "/projets", "/revuex"]) assert.ok(!exclu(chemin), chemin);
  assert.deepEqual(OPTIONS_PWA.workbox.runtimeCaching, [], "aucune réponse de l'API n'est mise en cache à l'exécution");
  assert.equal(OPTIONS_PWA.workbox.navigateFallback, "index.html", "l'application s'ouvre hors ligne");
  assert.deepEqual(OPTIONS_PWA.workbox.navigateFallbackDenylist, CHEMINS_EXCLUS);
  assert.ok(!OPTIONS_PWA.workbox.globPatterns.some((motif) => motif.includes("php")), "aucun fichier PHP dans le précache");
});

test("R09 : une nouvelle version est proposée, jamais imposée en plein relevé", () => {
  assert.equal(OPTIONS_PWA.registerType, "prompt");
  assert.equal(OPTIONS_PWA.strategies, "generateSW");
  assert.equal(OPTIONS_PWA.devOptions.enabled, false, "pas de service worker pendant le développement");
});
