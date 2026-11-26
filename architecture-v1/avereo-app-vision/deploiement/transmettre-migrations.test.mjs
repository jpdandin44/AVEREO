import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const lire = (chemin) => readFileSync(new URL(chemin, import.meta.url), "utf8");

// Incident du 26/11/2026 : lib/config.php chargeait lib/portal.php, absent du paquet de migration : le script
// s'arrêtait sur le serveur (erreur fatale PHP, code 255) avant toute migration.
test("migrations : le paquet transmis contient toutes les dépendances PHP de lib/config.php et de migrate.php", () => {
  const script = lire("./transmettre-migrations.sh");
  const ligne = script.split("\n").find((l) => l.includes("tar -cf"));
  assert.ok(ligne, "commande tar introuvable");
  const transmis = new Set(ligne.split(/\s+/).filter((mot) => /\.(php|sh)$|migrations$/.test(mot)));

  const config = lire("../frontend/public/api/lib/config.php");
  for (const [, fichier] of config.matchAll(/require(?:_once)?\s+__DIR__\s*\.\s*'\/([^']+\.php)'/g)) {
    assert.ok(transmis.has(`frontend/public/api/lib/${fichier}`), `lib/${fichier} doit être transmis avec lib/config.php`);
  }
  const migrate = lire("../database/migrate.php");
  for (const [, relatif] of migrate.matchAll(/require(?:_once)?\s+__DIR__\s*\.\s*'\/\.\.\/([^']+\.php)'/g)) {
    assert.ok(transmis.has(relatif), `${relatif} doit être transmis avec migrate.php`);
  }
  assert.ok(transmis.has("database/migrations"));
});
