import test from "node:test";
import assert from "node:assert/strict";
import { ecrasementsSubis, libelleEcrasement } from "../src/sync/journal.js";

const entree = (changements = {}) => ({
  id: 7, seq: 15, object_id: "piece-1", kind: "piece", created_at: "2026-11-24T20:01:02.123Z",
  lost: { rev: 3, data: { nom: "Salon" }, deleted: false, device_id: "appareil-a", by: "12" },
  won: { rev: 4, device_id: "appareil-b", by: "12" },
  ...changements,
});
const formaterDate = () => "24/11/2026 à 20:01";

test("les écrasements subis sont filtrés sur l'appareil perdant et triés par id croissant", () => {
  const autre = entree({ id: 2, lost: { ...entree().lost, device_id: "appareil-b" }, won: { ...entree().won, device_id: "appareil-a" } });
  const entrees = [entree({ id: 9 }), autre, entree({ id: 1 })];
  const copie = structuredClone(entrees);
  assert.deepEqual(ecrasementsSubis(entrees, "appareil-a"), [entrees[2], entrees[0]]);
  assert.deepEqual(ecrasementsSubis(entrees, "inconnu"), []);
  assert.deepEqual(entrees, copie);
});

test("le libellé d'une pièce reprend son nom perdu et la date formatée injectée", () => {
  const appelees = [];
  const libelle = libelleEcrasement(entree(), (iso) => {
    appelees.push(iso);
    return formaterDate();
  });
  assert.equal(libelle, "Votre modification de la pièce « Salon » a été remplacée par une modification plus récente le 24/11/2026 à 20:01.");
  assert.deepEqual(appelees, ["2026-11-24T20:01:02.123Z"]);
});

test("le libellé d'une ouverture supprimée emploie l'élision et son identifiant", () => {
  const suppression = entree({ object_id: "ouv-1", kind: "ouverture", lost: { ...entree().lost, deleted: true, data: null } });
  assert.equal(libelleEcrasement(suppression, formaterDate),
    "La suppression de l'ouverture « ouv-1 » a été remplacée par une modification plus récente le 24/11/2026 à 20:01.");
});

test("un nom absent est remplacé par l'identifiant de l'objet", () => {
  const sansNom = entree({ lost: { ...entree().lost, data: {} } });
  assert.equal(libelleEcrasement(sansNom, formaterDate),
    "Votre modification de la pièce « piece-1 » a été remplacée par une modification plus récente le 24/11/2026 à 20:01.");
});

test("les libellés bâtiment et niveau emploient le genre masculin", () => {
  assert.equal(libelleEcrasement(entree({ kind: "batiment" }), formaterDate),
    "Votre modification du bâtiment « Salon » a été remplacée par une modification plus récente le 24/11/2026 à 20:01.");
  assert.equal(libelleEcrasement(entree({ kind: "niveau" }), formaterDate),
    "Votre modification du niveau « Salon » a été remplacée par une modification plus récente le 24/11/2026 à 20:01.");
});

test("le libellé d'une suppression de pièce garde le nom de la valeur perdue", () => {
  const suppression = entree({ lost: { ...entree().lost, deleted: true } });
  const copie = structuredClone(suppression);
  assert.equal(libelleEcrasement(suppression, formaterDate),
    "La suppression de la pièce « Salon » a été remplacée par une modification plus récente le 24/11/2026 à 20:01.");
  assert.deepEqual(suppression, copie);
});
