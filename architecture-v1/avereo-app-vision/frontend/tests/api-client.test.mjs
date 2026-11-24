// Client d'API : en-têtes, requêtes, erreurs en français. Aucun réseau : un faux fetch.
import test from "node:test";
import assert from "node:assert/strict";
import { ErreurApi, creerClient } from "../src/services/api.js";

function faussesReponses(...reponses) {
  const appels = [];
  const fetchImpl = async (url, options) => {
    appels.push({ url, options });
    const suivante = reponses.shift();
    if (suivante instanceof Error) throw suivante;
    return { ok: suivante.status < 400, status: suivante.status, json: async () => suivante.corps };
  };
  return { appels, fetchImpl };
}

test("liste : paramètres de requête, cookie de même origine, pas de jeton en production", async () => {
  const { appels, fetchImpl } = faussesReponses({ status: 200, corps: { ok: true, projects: [{ id: "a" }] } });
  const client = creerClient({ fetchImpl });
  const projets = await client.listerProjets({ statut: "archived", q: "rivoli" });
  assert.deepEqual(projets, [{ id: "a" }]);
  assert.equal(appels[0].url, "/api/projects.php?status=archived&q=rivoli&limit=50&offset=0");
  assert.equal(appels[0].options.credentials, "same-origin");
  assert.equal(appels[0].options.headers.Authorization, undefined);
});

test("développement : jeton et identité de test envoyés en en-têtes", async () => {
  const { appels, fetchImpl } = faussesReponses({ status: 200, corps: { ok: true, role: "conseiller" } });
  await creerClient({ fetchImpl, jeton: "j".repeat(40), utilisateur: "11" }).identite();
  assert.equal(appels[0].options.headers.Authorization, `Bearer ${"j".repeat(40)}`);
  assert.equal(appels[0].options.headers["X-Vision-Local-User"], "11");
});

test("création et modification : JSON, bonne méthode, identifiant en paramètre", async () => {
  const { appels, fetchImpl } = faussesReponses(
    { status: 201, corps: { ok: true, project: { id: "x", name: "N" } } },
    { status: 200, corps: { ok: true, project: { id: "x", name: "M", status: "archived" } } },
  );
  const client = creerClient({ fetchImpl });
  assert.equal((await client.creerProjet({ name: "N" })).name, "N");
  assert.equal(appels[0].options.method, "POST");
  assert.equal(appels[0].options.headers["Content-Type"], "application/json");
  assert.deepEqual(JSON.parse(appels[0].options.body), { name: "N" });
  const modifie = await client.modifierProjet("x", { status: "archived" });
  assert.equal(modifie.status, "archived");
  assert.equal(appels[1].options.method, "PATCH");
  assert.equal(appels[1].url, "/api/projects.php?id=x");
});

test("déconnexion : POST vers logout.php", async () => {
  const { appels, fetchImpl } = faussesReponses({ status: 200, corps: { ok: true } });
  await creerClient({ fetchImpl }).deconnecter();
  assert.equal(appels[0].url, "/api/logout.php");
  assert.equal(appels[0].options.method, "POST");
});

test("erreurs : 401, validation 422 avec champs, réseau coupé, réponse sans JSON", async () => {
  const { fetchImpl } = faussesReponses(
    { status: 401, corps: { ok: false, error: "unauthenticated", message: "Authentification requise." } },
    { status: 422, corps: { ok: false, error: "validation_failed", message: "Données invalides.", fields: { name: "Champ obligatoire." } } },
    new TypeError("Failed to fetch"),
    { status: 500, corps: null },
  );
  const client = creerClient({ fetchImpl });
  await assert.rejects(client.identite(), (e) => e instanceof ErreurApi && e.statut === 401 && e.code === "unauthenticated");
  await assert.rejects(client.creerProjet({}), (e) => e.statut === 422 && e.champs.name === "Champ obligatoire.");
  await assert.rejects(client.listerProjets(), (e) => e.statut === 0 && e.code === "reseau" && /injoignable/.test(e.message));
  // Un 5xx sans JSON vient d'une passerelle ou d'un proxy : c'est une coupure (voir le test suivant), pas une erreur de l'API.
  await assert.rejects(client.listerProjets(), (e) => e.statut === 0 && e.code === "reseau");
});

test("coupure : un 5xx sans JSON (proxy, passerelle, maintenance) compte comme un serveur injoignable ; un 5xx JSON de l'API reste une erreur", async () => {
  const sansJson = { ok: false, status: 502, json: async () => { throw new SyntaxError("pas du JSON"); } };
  const client = creerClient({ fetchImpl: async () => sansJson });
  await assert.rejects(client.identite(), (e) => e instanceof ErreurApi && e.statut === 0 && e.code === "reseau");
  const { fetchImpl } = faussesReponses({ status: 503, corps: { ok: false, error: "database_unavailable", message: "La base de données est indisponible." } });
  await assert.rejects(creerClient({ fetchImpl }).identite(), (e) => e.statut === 503 && e.code === "database_unavailable");
});

test("synchronisation : envoi, réception et journal appellent sync.php avec les bons paramètres", async () => {
  const { appels, fetchImpl } = faussesReponses(
    { status: 200, corps: { ok: true, applied: [], changes: [], seq: 3, has_more: false } },
    { status: 200, corps: { ok: true, changes: [], seq: 3, has_more: false } },
    { status: 200, corps: { ok: true, entries: [{ id: 5 }] } },
    { status: 201, corps: { ok: true, project: { id: "a".repeat(32), name: "N" } } },
  );
  const client = creerClient({ fetchImpl });
  await client.synchroniser("p1", { deviceId: "telephone-01", since: 2, changes: [{ object_id: "x" }] });
  assert.equal(appels[0].url, "/api/sync.php?project=p1");
  assert.equal(appels[0].options.method, "POST");
  assert.deepEqual(JSON.parse(appels[0].options.body), { device_id: "telephone-01", since: 2, changes: [{ object_id: "x" }] });
  await client.recevoir("p1", 0);
  assert.equal(appels[1].url, "/api/sync.php?project=p1&since=0");
  assert.deepEqual(await client.journal("p1", 4), [{ id: 5 }]);
  assert.equal(appels[2].url, "/api/sync.php?project=p1&journal=1&after=4");
  await client.creerProjet({ id: "a".repeat(32), name: "N" });
  assert.deepEqual(JSON.parse(appels[3].options.body), { id: "a".repeat(32), name: "N" });
});
