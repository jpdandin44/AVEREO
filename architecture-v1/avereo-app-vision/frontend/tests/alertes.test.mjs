import test from "node:test";
import assert from "node:assert/strict";
import { ALERTES, decrireErreur } from "../src/domain/alertes.js";

test("R12 : chaque alerte a une icône ET un libellé, jamais la couleur seule", () => {
  for (const [code, alerte] of Object.entries(ALERTES)) {
    assert.ok(alerte.icone, `${code} sans icône`);
    assert.ok(alerte.titre.trim().length > 0, `${code} sans titre`);
    assert.ok(alerte.libelle.trim().length > 10, `${code} sans libellé`);
  }
});

test("une erreur inconnue reçoit quand même icône et libellé", () => {
  const description = decrireErreur({ code: "INCONNUE" });
  assert.equal(description.icone, "alerte");
  assert.ok(description.libelle.length > 0);
});

test("le numéro du mur est indiqué à partir de 1", () => {
  const description = decrireErreur({ code: "OUVERTURE_HORS_MUR", murIndex: 0 });
  assert.match(description.libelle, /mur 1/);
});
