// Rechargement pour une nouvelle version : jamais sans confirmation s'il peut faire perdre des modifications.
import test from "node:test";
import assert from "node:assert/strict";
import { abonnerEcritures, ecrituresEnEchec, rechargementRisque, signalerEcriture } from "../src/sync/etat-ecriture.js";

test("rechargement risqué : écriture locale en échec, ou stockage temporaire avec des envois en attente", () => {
  assert.equal(rechargementRisque({ echecsEcriture: 0, durable: true, enAttente: 5 }), false, "stockage durable : les modifications sont sur l'appareil");
  assert.equal(rechargementRisque({ echecsEcriture: 1, durable: true, enAttente: 0 }), true);
  assert.equal(rechargementRisque({ echecsEcriture: 0, durable: false, enAttente: 1 }), true);
  assert.equal(rechargementRisque({ echecsEcriture: 0, durable: false, enAttente: 0 }), false);
});

test("écritures en échec suivies par projet, avec notification", () => {
  let notifications = 0;
  const desabonner = abonnerEcritures(() => (notifications += 1));
  signalerEcriture("p1", true);
  signalerEcriture("p1", true); // pas de changement : pas de notification
  signalerEcriture("p2", true);
  assert.equal(ecrituresEnEchec(), 2);
  signalerEcriture("p1", false);
  signalerEcriture("p2", false);
  assert.equal(ecrituresEnEchec(), 0);
  assert.equal(notifications, 4);
  desabonner();
});
