// Plugin de développement : l'API locale n'est jointe que depuis la machine elle-même (jeton de test jamais exposé au réseau).
import test from "node:test";
import assert from "node:assert/strict";
import { adresseEstLocale, filtreBoucleLocale } from "../vite-plugins/boucle-locale.js";

function appeler(url, adresse) {
  const res = { statusCode: 200, entetes: {}, corps: "", setHeader(k, v) { this.entetes[k] = v; }, end(c) { this.corps = c; } };
  let suivant = false;
  filtreBoucleLocale({ url, socket: { remoteAddress: adresse } }, res, () => { suivant = true; });
  return { suivant, res };
}

test("adresses locales reconnues, adresses du réseau refusées", () => {
  for (const a of ["127.0.0.1", "::1", "::ffff:127.0.0.1"]) assert.equal(adresseEstLocale(a), true, a);
  for (const a of ["192.168.1.20", "10.0.0.5", "::ffff:192.168.1.20", "", undefined, null, "127.0.0.1.evil"]) assert.equal(adresseEstLocale(a), false, String(a));
});

test("un appareil du réseau n'atteint ni /api ni /connect (403)", () => {
  for (const url of ["/api/projects.php", "/api/auth.php?x=1", "/connect/entry.php?ticket=x", "/api"]) {
    const { suivant, res } = appeler(url, "192.168.1.20");
    assert.equal(suivant, false, url);
    assert.equal(res.statusCode, 403, url);
  }
});

test("la machine locale passe ; les pages et ressources restent servies à tous (test sur smartphone)", () => {
  assert.equal(appeler("/api/projects.php", "127.0.0.1").suivant, true);
  assert.equal(appeler("/", "192.168.1.20").suivant, true);
  assert.equal(appeler("/assets/index.js", "192.168.1.20").suivant, true);
  assert.equal(appeler("/apiary.png", "192.168.1.20").suivant, true, "seuls /api et /connect sont protégés");
});
