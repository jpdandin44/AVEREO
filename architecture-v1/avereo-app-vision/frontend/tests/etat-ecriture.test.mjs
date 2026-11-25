// Rechargement pour une nouvelle version : jamais sans confirmation s'il peut faire perdre des modifications.
import test from "node:test";
import assert from "node:assert/strict";
import { abonnerEcritures, ecritureCommencee, ecritureTerminee, ecrituresNonPersistees, oublierEcritures, rechargementRisque } from "../src/sync/etat-ecriture.js";

test("rechargement risqué : écriture locale en cours ou en échec, ou stockage temporaire avec des envois en attente", () => {
  assert.equal(rechargementRisque({ nonPersistees: 0, durable: true, enAttente: 5 }), false, "stockage durable : les modifications sont sur l'appareil");
  assert.equal(rechargementRisque({ nonPersistees: 1, durable: true, enAttente: 0 }), true);
  assert.equal(rechargementRisque({ nonPersistees: 0, durable: false, enAttente: 1 }), true);
  assert.equal(rechargementRisque({ nonPersistees: 0, durable: false, enAttente: 0 }), false);
});

test("une écriture compte dès son début, jusqu'à sa réussite ; un échec reste compté jusqu'à la réussite suivante", () => {
  let notifications = 0;
  const desabonner = abonnerEcritures(() => (notifications += 1));
  ecritureCommencee("p1");
  assert.equal(ecrituresNonPersistees(), 1, "en cours : déjà à risque");
  ecritureCommencee("p1");
  ecritureTerminee("p1", true);
  assert.equal(ecrituresNonPersistees(), 1, "une deuxième écriture est encore en cours");
  ecritureTerminee("p1", true);
  assert.equal(ecrituresNonPersistees(), 0);
  ecritureCommencee("p2");
  ecritureTerminee("p2", false);
  assert.equal(ecrituresNonPersistees(), 1, "échec : à risque");
  ecritureCommencee("p2");
  ecritureTerminee("p2", true);
  assert.equal(ecrituresNonPersistees(), 0, "la reprise a réussi");
  ecritureCommencee("p3");
  oublierEcritures("p3");
  assert.equal(ecrituresNonPersistees(), 0);
  assert.ok(notifications >= 4);
  desabonner();
});
