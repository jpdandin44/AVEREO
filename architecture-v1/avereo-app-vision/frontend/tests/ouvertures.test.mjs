// R33 : une ouverture reste dans son mur ; un dépassement est refusé avec un message.
import test from "node:test";
import assert from "node:assert/strict";
import { ajouterOuverture, creerOuverture, creerPieceRectangulaire, trouverPositionLibre, validerOuverture } from "../src/domain/modele.js";

const salon = () => creerPieceRectangulaire({ id: "p", longueurMm: 4000, largeurMm: 3000, hauteurMm: 2500 });

test("une porte de 0,90 m posée à 0,50 m sur un mur de 4,00 m est acceptée", () => {
  assert.equal(validerOuverture(salon(), creerOuverture({ id: "o", type: "porte", murIndex: 0, positionMm: 500 })), null);
});

test("une ouverture qui dépasse du mur est refusée avec un message qui donne la longueur du mur", () => {
  const message = validerOuverture(salon(), creerOuverture({ id: "o", type: "porte", murIndex: 0, positionMm: 3500 }));
  assert.match(message, /dépasserait du mur/);
  assert.match(message, /4,00 m/);
  assert.match(validerOuverture(salon(), creerOuverture({ id: "o", type: "porte", murIndex: 0, positionMm: -10 })), /dépasserait du mur/);
});

test("pile au bout du mur : acceptée (3,10 m + 0,90 m = 4,00 m)", () => {
  assert.equal(validerOuverture(salon(), creerOuverture({ id: "o", type: "porte", murIndex: 0, positionMm: 3100 })), null);
});

test("une ouverture plus haute que le plafond est refusée", () => {
  const trop = creerOuverture({ id: "o", type: "fenetre", murIndex: 0, positionMm: 500, hauteurMm: 1700 }); // allège 900 + 1700 = 2600 > 2500
  assert.match(validerOuverture(salon(), trop), /plafond/);
});

test("deux ouvertures qui se chevauchent : refusé ; bord à bord : accepté", () => {
  const piece = ajouterOuverture(salon(), creerOuverture({ id: "a", type: "porte", murIndex: 0, positionMm: 500 })); // 500 → 1400
  assert.match(validerOuverture(piece, creerOuverture({ id: "b", type: "porte", murIndex: 0, positionMm: 1000 })), /chevaucherait/);
  assert.equal(validerOuverture(piece, creerOuverture({ id: "b", type: "porte", murIndex: 0, positionMm: 1400 })), null);
  assert.equal(validerOuverture(piece, creerOuverture({ id: "a", type: "porte", murIndex: 0, positionMm: 1000 })), null); // la même ouverture déplacée
});

test("mur inexistant : refusé", () => {
  assert.match(validerOuverture(salon(), creerOuverture({ id: "o", type: "porte", murIndex: 7, positionMm: 500 })), /n'existe pas/);
});

test("position libre pour une nouvelle ouverture : 500 mm si possible, sinon la première place", () => {
  assert.equal(trouverPositionLibre(salon(), creerOuverture({ id: "n", type: "porte", murIndex: 0, positionMm: 0 })), 500);
  const pris = ajouterOuverture(salon(), creerOuverture({ id: "a", type: "porte", murIndex: 0, positionMm: 500 }));
  assert.equal(trouverPositionLibre(pris, creerOuverture({ id: "n", type: "porte", murIndex: 0, positionMm: 0 })), 1400);
});

test("mur trop court : pas de place", () => {
  const etroit = creerPieceRectangulaire({ id: "e", longueurMm: 4000, largeurMm: 800, hauteurMm: 2500 }); // mur 1 de 0,80 m
  assert.equal(trouverPositionLibre(etroit, creerOuverture({ id: "n", type: "porte", murIndex: 1, positionMm: 0 })), null);
});
