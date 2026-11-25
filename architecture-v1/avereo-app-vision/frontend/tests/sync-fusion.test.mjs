import test from "node:test";
import assert from "node:assert/strict";
import { appliquerReception } from "../src/sync/fusion.js";
import { empiler } from "../src/sync/file-envoi.js";

const local = (rev = 1) => ({ id: "piece-1", kind: "piece", parentId: "niveau-1", data: {
  nom: "Salon local", hauteurMm: 2500, ordre: 0,
  sommets: [{ x: 0, y: 0 }, { x: 4000, y: 0 }, { x: 4000, y: 3000 }, { x: 0, y: 3000 }],
}, rev, deleted: false });
const recu = (rev = 2) => ({ object_id: "piece-1", kind: "piece", parent_id: "niveau-2",
  data: { ...local().data, nom: "Salon distant", hauteurMm: 2700 },
  deleted: false, rev, seq: rev + 10, updated_by: "12", device_id: "appareil-distant",
});
const enFile = (objet) => empiler([], [{
  objectId: objet.id, kind: objet.kind, parentId: objet.parentId, data: objet.data, deleted: objet.deleted,
}], () => objet.rev);

test("un reçu plus récent sans modification locale remplace tous les champs synchronisés", () => {
  const objet = local();
  const reception = recu();
  const resultat = appliquerReception(new Map([[objet.id, objet]]), [], [reception]);
  assert.deepEqual(resultat.objets.get(objet.id), {
    id: objet.id, kind: "piece", parentId: "niveau-2", data: reception.data, rev: 2, deleted: false,
  });
  assert.deepEqual(resultat.enAttente, []);
});

test("un objet inconnu est ajouté à une nouvelle Map", () => {
  const objets = new Map();
  const reception = recu();
  const resultat = appliquerReception(objets, [], [reception]);
  assert.equal(resultat.objets.size, 1);
  assert.equal(resultat.objets.get("piece-1").data.nom, "Salon distant");
  assert.equal(objets.size, 0);
  assert.notStrictEqual(resultat.objets, objets);
});

test("un reçu de révision inférieure est ignoré même si son contenu diffère", () => {
  const objet = local(3);
  const resultat = appliquerReception(new Map([[objet.id, objet]]), enFile(objet), [recu(2)]);
  assert.strictEqual(resultat.objets.get(objet.id), objet);
  assert.deepEqual(resultat.enAttente, []);
});

test("un reçu de révision égale est ignoré", () => {
  const objet = local(2);
  const resultat = appliquerReception(new Map([[objet.id, objet]]), [], [recu(2)]);
  assert.strictEqual(resultat.objets.get(objet.id), objet);
  assert.deepEqual(resultat.enAttente, []);
});

test("un objet en attente conserve son contenu local, relève rev, et garde strictement la file et baseRev", () => {
  const objet = local();
  const objets = new Map([[objet.id, objet]]);
  const file = enFile(objet);
  const copie = structuredClone(file);
  Object.freeze(file[0]);
  Object.freeze(file);
  const resultat = appliquerReception(objets, file, [recu(2)]);
  assert.deepEqual(resultat.objets.get(objet.id), { ...objet, rev: 2 });
  assert.deepEqual(resultat.enAttente, [objet.id]);
  assert.deepEqual(file, copie);
  assert.equal(file[0].baseRev, 1);
  assert.equal(objets.get(objet.id).rev, 1);
});

test("plusieurs reçus successifs relèvent la révision sans doublon dans enAttente", () => {
  const objet = local();
  const resultat = appliquerReception(new Map([[objet.id, objet]]), enFile(objet), [recu(2), recu(3), recu(3)]);
  assert.deepEqual(resultat.objets.get(objet.id), { ...objet, rev: 3 });
  assert.deepEqual(resultat.enAttente, [objet.id]);
});

test("une suppression reçue est conservée comme objet supprimé sans modification locale", () => {
  const objet = local();
  const resultat = appliquerReception(new Map([[objet.id, objet]]), [], [{ ...recu(), data: null, deleted: true }]);
  assert.deepEqual(resultat.objets.get(objet.id), {
    id: objet.id, kind: "piece", parentId: "niveau-2", data: null, rev: 2, deleted: true,
  });
});

test("une suppression locale en attente reste supprimée malgré une valeur distante plus récente", () => {
  const objet = { ...local(), data: null, deleted: true };
  const resultat = appliquerReception(new Map([[objet.id, objet]]), enFile(objet), [recu()]);
  assert.deepEqual(resultat.objets.get(objet.id), { ...objet, rev: 2 });
  assert.deepEqual(resultat.enAttente, [objet.id]);
});

test("une suppression distante ne masque pas une modification locale en attente", () => {
  const objet = local();
  const resultat = appliquerReception(new Map([[objet.id, objet]]), enFile(objet), [{ ...recu(), data: null, deleted: true }]);
  assert.deepEqual(resultat.objets.get(objet.id), { ...objet, rev: 2 });
});

test("la fusion ne modifie ni la Map d'entrée, ni ses objets, ni la réception", () => {
  const objet = local();
  const objets = new Map([[objet.id, objet]]);
  const recus = [recu(2), { ...recu(3), object_id: "piece-2" }];
  const copieObjets = structuredClone(objets);
  const copieRecus = structuredClone(recus);
  appliquerReception(objets, [], recus);
  appliquerReception(objets, enFile(objet), recus);
  assert.deepEqual(objets, copieObjets);
  assert.deepEqual(recus, copieRecus);
});
