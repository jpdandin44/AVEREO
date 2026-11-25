// Stockage local : le même contrat pour la mémoire et pour Dexie (IndexedDB simulé par fake-indexeddb).
import test from "node:test";
import assert from "node:assert/strict";
import { IDBKeyRange, indexedDB } from "fake-indexeddb";
import { creerStockageDexie, nomBase } from "../src/sync/stockage-dexie.js";
import { creerStockageMemoire } from "../src/sync/stockage-memoire.js";

let compteur = 0;
const fabriques = {
  mémoire: () => creerStockageMemoire(),
  Dexie: () => creerStockageDexie({ nom: `test-${(compteur += 1)}-${Math.random()}`, indexedDB, IDBKeyRange }),
};

const objet = (id, extra = {}) => ({ id, kind: "piece", parentId: "niveau-1", data: { nom: id }, rev: 1, deleted: false, ...extra });
const entree = (objectId, extra = {}) => ({ objectId, kind: "piece", parentId: "niveau-1", data: { nom: objectId }, deleted: false, baseRev: 0, version: 1, ...extra });

for (const [nom, fabrique] of Object.entries(fabriques)) {
  test(`stockage ${nom} : méta, projets et opérations`, async () => {
    const s = fabrique();
    assert.equal(await s.lireMeta("device_id"), undefined);
    await s.ecrireMeta("device_id", "abc");
    assert.equal(await s.lireMeta("device_id"), "abc");
    await s.sauverProjets([{ id: "p1", name: "Un" }, { id: "p2", name: "Deux" }]);
    await s.sauverProjets([{ id: "p1", name: "Un (renommé)" }]);
    assert.deepEqual((await s.listerProjets()).map((p) => p.name).sort(), ["Deux", "Un (renommé)"]);
    assert.equal((await s.lireProjet("p1")).name, "Un (renommé)");
    await s.retirerProjets(["p2"]);
    assert.deepEqual((await s.listerProjets()).map((p) => p.id), ["p1"]);
    assert.deepEqual(await s.lireOperations(), []);
    await s.ecrireOperations([{ type: "creer", id: "p1", champs: { name: "Un" } }]);
    assert.equal((await s.lireOperations())[0].type, "creer");
    s.fermer?.();
  });

  test(`stockage ${nom} : objets, file d'envoi et curseur d'un projet s'écrivent ensemble et se relisent`, async () => {
    const s = fabrique();
    assert.deepEqual(await s.chargerProjet("p1"), { objets: [], file: [], seq: 0 });
    await s.sauverProjet("p1", { objets: [objet("a"), objet("b")], file: [entree("a")], seq: 4 });
    await s.sauverProjet("p1", { objets: [objet("b", { rev: 2, data: { nom: "B2" } })] }); // ne touche ni la file ni le curseur
    const lu = await s.chargerProjet("p1");
    assert.deepEqual(lu.objets.map((o) => [o.id, o.rev]).sort(), [["a", 1], ["b", 2]]);
    assert.equal(lu.objets.find((o) => o.id === "b").data.nom, "B2");
    assert.equal(lu.objets[0].projectId, undefined, "le champ interne de clé n'est jamais exposé");
    assert.equal(lu.file.length, 1);
    assert.equal(lu.seq, 4);
    await s.sauverProjet("p1", { file: [] });
    assert.equal((await s.chargerProjet("p1")).file.length, 0);
    assert.equal((await s.chargerProjet("p1")).seq, 4);
    assert.deepEqual((await s.chargerProjet("autre")).objets, [], "un autre projet est vide");
    s.fermer?.();
  });

  test(`stockage ${nom} : projets ayant des modifications en attente`, async () => {
    const s = fabrique();
    await s.sauverProjet("p1", { objets: [objet("a")], file: [entree("a")] });
    await s.sauverProjet("p2", { objets: [objet("a")], file: [] });
    assert.deepEqual(await s.listerProjetsEnAttente(), ["p1"]);
    s.fermer?.();
  });

  test(`stockage ${nom} : journal sans doublon, par identifiant croissant, par projet`, async () => {
    const s = fabrique();
    await s.ajouterJournal("p1", [{ id: 3, object_id: "c" }, { id: 1, object_id: "a" }]);
    await s.ajouterJournal("p1", [{ id: 1, object_id: "a" }, { id: 2, object_id: "b" }]);
    await s.ajouterJournal("p2", [{ id: 1, object_id: "z" }]);
    assert.deepEqual((await s.lireJournal("p1")).map((e) => e.id), [1, 2, 3]);
    assert.deepEqual((await s.lireJournal("p2")).map((e) => e.object_id), ["z"]);
    s.fermer?.();
  });
}

test("stockage : ce qui sort est une copie (modifier la copie ne change pas l'état stocké)", async () => {
  const s = creerStockageMemoire();
  await s.sauverProjet("p1", { objets: [objet("a")] });
  const lu = await s.chargerProjet("p1");
  lu.objets[0].data.nom = "piraté";
  assert.equal((await s.chargerProjet("p1")).objets[0].data.nom, "a");
});

test("R03 Dexie : les données survivent à la fermeture de la base (rechargement de la page)", async () => {
  const nom = `rechargement-${Math.random()}`;
  const avant = creerStockageDexie({ nom, indexedDB, IDBKeyRange });
  await avant.sauverProjet("p1", { objets: [objet("a")], file: [entree("a")], seq: 7 });
  await avant.ecrireOperations([{ type: "creer", id: "p1", champs: { name: "Hors ligne" } }]);
  avant.fermer();
  const apres = creerStockageDexie({ nom, indexedDB, IDBKeyRange });
  const lu = await apres.chargerProjet("p1");
  assert.equal(lu.objets.length, 1);
  assert.equal(lu.file[0].objectId, "a");
  assert.equal(lu.seq, 7);
  assert.equal((await apres.lireOperations())[0].champs.name, "Hors ligne");
  apres.fermer();
});

test("R08 Dexie : une base par identité, cloisonnée (un autre compte sur le même appareil ne voit rien)", async () => {
  const alice = { provider: "avereo_connect", id: `alice-${Math.random()}` };
  const bob = { provider: "avereo_connect", id: `bob-${Math.random()}` };
  assert.notEqual(nomBase(alice), nomBase(bob));
  const a = creerStockageDexie({ nom: nomBase(alice), indexedDB, IDBKeyRange });
  const b = creerStockageDexie({ nom: nomBase(bob), indexedDB, IDBKeyRange });
  await a.sauverProjets([{ id: "p1", name: "Privé d'Alice" }]);
  await a.sauverProjet("p1", { objets: [objet("a")], file: [entree("a")] });
  assert.deepEqual(await b.listerProjets(), []);
  assert.deepEqual((await b.chargerProjet("p1")).objets, []);
  assert.deepEqual(await b.listerProjetsEnAttente(), []);
  a.fermer();
  b.fermer();
});
