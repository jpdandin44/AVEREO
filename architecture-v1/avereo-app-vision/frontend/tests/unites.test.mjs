import test from "node:test";
import assert from "node:assert/strict";
import {
  analyserLongueur,
  arrondir,
  formaterLongueurMm,
  formaterNombre,
  formaterSurface,
  formaterVolume,
  texteDepuisMm,
} from "../src/domain/unites.js";

test("R28 : 4,00 m saisi s'enregistre 4000 mm", () => {
  assert.deepEqual(analyserLongueur("4,00", "m"), { ok: true, mm: 4000 });
  assert.deepEqual(analyserLongueur("4.00", "m"), { ok: true, mm: 4000 });
  assert.deepEqual(analyserLongueur(" 400 ", "cm"), { ok: true, mm: 4000 });
  assert.deepEqual(analyserLongueur("4000", "mm"), { ok: true, mm: 4000 });
  assert.deepEqual(analyserLongueur("2,04", "m"), { ok: true, mm: 2040 });
});

test("R28 : une surface de 11,995 m² s'affiche 12,00 m² sans changer la valeur interne", () => {
  const interne = 11.995;
  assert.equal(formaterSurface(interne), "12,00 m²");
  assert.equal(interne, 11.995);
});

test("arrondi commercial insensible aux erreurs de virgule flottante", () => {
  assert.equal(arrondir(11.995), 12);
  assert.equal(arrondir(31.964), 31.96);
  assert.equal(arrondir(3.036), 3.04);
  assert.equal(arrondir(1.005), 1.01);
  assert.equal(arrondir(-1.005), -1.01);
  assert.equal(arrondir(0), 0);
});

test("affichage à la française", () => {
  assert.equal(formaterNombre(35), "35,00");
  assert.equal(formaterVolume(30), "30,00 m³");
  assert.equal(formaterLongueurMm(4000), "4,00 m");
  assert.equal(formaterLongueurMm(2040), "2,04 m");
});

test("saisies invalides refusées avec un message", () => {
  for (const texte of ["", "   ", "abc", "-4", "4,0,0", "0", "0,00"]) {
    const resultat = analyserLongueur(texte, "m");
    assert.equal(resultat.ok, false, `« ${texte} » devrait être refusé`);
    assert.ok(resultat.message.length > 0);
  }
  assert.equal(analyserLongueur("101", "m").ok, false);
  assert.equal(analyserLongueur(undefined, "m").ok, false);
});

test("texte de saisie depuis des millimètres", () => {
  assert.equal(texteDepuisMm(4000, "m"), "4,00");
  assert.equal(texteDepuisMm(2040, "cm"), "204,0");
  assert.equal(texteDepuisMm(900, "mm"), "900");
});
