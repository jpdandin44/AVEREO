import test from "node:test";
import assert from "node:assert/strict";
import { PROFONDEUR_MAX, annuler, creerHistorique, peutAnnuler, peutRetablir, retablir, valider } from "../src/domain/historique.js";

test("R34 : après 20 actions, 20 annulations ramènent l'état initial et 20 rétablissements le restituent", () => {
  const initial = { n: 0 };
  let h = creerHistorique(initial);
  const etats = [initial];
  for (let i = 1; i <= 20; i += 1) {
    const etat = { n: i };
    etats.push(etat);
    h = valider(h, etat);
  }
  assert.equal(h.present, etats[20]);
  for (let i = 0; i < 20; i += 1) h = annuler(h);
  assert.equal(h.present, initial);
  assert.equal(peutAnnuler(h), false);
  for (let i = 0; i < 20; i += 1) h = retablir(h);
  assert.equal(h.present, etats[20]);
  assert.equal(peutRetablir(h), false);
});

test("une nouvelle action efface les états rétablissables", () => {
  let h = creerHistorique("a");
  h = valider(h, "b");
  h = annuler(h);
  assert.equal(peutRetablir(h), true);
  h = valider(h, "c");
  assert.equal(peutRetablir(h), false);
  assert.equal(h.present, "c");
});

test("annuler et rétablir sans effet aux extrémités ; état identique ignoré", () => {
  const h = creerHistorique("a");
  assert.equal(annuler(h), h);
  assert.equal(retablir(h), h);
  assert.equal(valider(h, "a"), h);
});

test("profondeur bornée", () => {
  let h = creerHistorique(0);
  for (let i = 1; i <= PROFONDEUR_MAX + 50; i += 1) h = valider(h, i);
  assert.equal(h.passe.length, PROFONDEUR_MAX);
});
