// R33 : glisser une ouverture applique les mêmes refus que la saisie au clavier (remarque de la relecture Codex).
import test from "node:test";
import assert from "node:assert/strict";
import { centreOuverture, deplacerOuverture } from "../src/features/plan2d/glisserOuverture.js";
import { ajouterOuverture, creerOuverture, creerPieceRectangulaire, trouverPositionLibre } from "../src/domain/modele.js";

function deuxPortes() {
  let piece = creerPieceRectangulaire({ id: "p", longueurMm: 4000, largeurMm: 3000, hauteurMm: 2500 });
  piece = ajouterOuverture(piece, creerOuverture({ id: "a", type: "porte", murIndex: 0, positionMm: 500 })); // 500 → 1400
  piece = ajouterOuverture(piece, creerOuverture({ id: "b", type: "porte", murIndex: 0, positionMm: 2000 })); // 2000 → 2900
  return piece;
}

test("glisser une porte sur une position libre : acceptée, arrondie à 10 mm", () => {
  const piece = deuxPortes();
  const b = piece.ouvertures[1];
  const r = deplacerOuverture(piece, b, { x: 2800, y: 0 }); // centre à 2800 → position 2350
  assert.notEqual(r.piece, null);
  assert.equal(r.positionMm, 2350);
  assert.equal(r.piece.ouvertures[1].positionMm, 2350);
});

test("glisser une porte sur une autre : refusé, l'ouverture garde sa dernière position valide", () => {
  const piece = deuxPortes();
  const b = piece.ouvertures[1];
  const r = deplacerOuverture(piece, b, { x: 1000, y: 0 }); // centre à 1000 → position 550, chevauche la porte a
  assert.equal(r.piece, null);
  assert.match(r.message, /chevaucherait/);
  assert.equal(r.positionMm, 2000);
});

test("bord à bord : accepté", () => {
  const piece = deuxPortes();
  const r = deplacerOuverture(piece, piece.ouvertures[1], { x: 1850, y: 0 }); // position 1400, contre la porte a
  assert.notEqual(r.piece, null);
  assert.equal(r.positionMm, 1400);
});

test("la poignée ne sort jamais du mur", () => {
  const piece = deuxPortes();
  const r = deplacerOuverture(piece, piece.ouvertures[1], { x: 99_000, y: 0 });
  assert.equal(r.positionMm, 3100); // 4000 − 900
  const r2 = deplacerOuverture(piece, piece.ouvertures[0], { x: -5000, y: 0 });
  assert.equal(r2.positionMm, 0);
});

test("centre de l'ouverture sur son mur", () => {
  const piece = deuxPortes();
  assert.deepEqual(centreOuverture(piece, piece.ouvertures[0]), { x: 950, y: 0 });
  const mur1 = { ...creerOuverture({ id: "f", type: "fenetre", murIndex: 1, positionMm: 900 }) }; // mur 1 : de (4000;0) à (4000;3000)
  assert.deepEqual(centreOuverture(piece, mur1), { x: 4000, y: 1500 });
});

test("position libre : un intervalle qui ne commence pas à un multiple de 100 mm est trouvé", () => {
  // Mur de 3000 mm, ouvertures [0, 950] et [1850, 2750] : une porte de 900 mm tient exactement à 950 mm.
  let piece = creerPieceRectangulaire({ id: "q", longueurMm: 3000, largeurMm: 2500, hauteurMm: 2500 });
  piece = ajouterOuverture(piece, creerOuverture({ id: "x", type: "porte", murIndex: 0, positionMm: 0, largeurMm: 950 }));
  piece = ajouterOuverture(piece, creerOuverture({ id: "y", type: "porte", murIndex: 0, positionMm: 1850, largeurMm: 900 }));
  const nouvelle = creerOuverture({ id: "n", type: "porte", murIndex: 0, positionMm: 0 });
  assert.equal(trouverPositionLibre(piece, nouvelle), 950);
});
