// Cas relevés par la relecture Opus du Lot 1 (relecteur des calculs de métré) : chacun avec des chiffres.
import test from "node:test";
import assert from "node:assert/strict";
import { calculerMetres, calculerMetresNiveau } from "../src/domain/metres.js";
import {
  ajouterOuverture,
  creerNiveau,
  creerOuverture,
  creerPiece,
  creerPieceRectangulaire,
  definirLongueurMur,
  insererSommet,
  supprimerSommet,
} from "../src/domain/modele.js";
import { analyserLongueur, texteDepuisMm } from "../src/domain/unites.js";

const salon = () => creerPieceRectangulaire({ id: "p", longueurMm: 4000, largeurMm: 3000, hauteurMm: 2500 });
const codes = (m) => m.erreurs.map((e) => e.code);

test("ouverture de largeur négative : signalée et non comptée (elle gonflerait les murs nets)", () => {
  const piece = ajouterOuverture(salon(), creerOuverture({ id: "o", type: "porte", murIndex: 0, positionMm: 500, largeurMm: -900 }));
  const m = calculerMetres(piece);
  assert.deepEqual(codes(m), ["OUVERTURE_DIMENSION_INVALIDE"]);
  assert.equal(m.ouverturesM2, 0);
  assert.equal(m.mursNetsM2, 35);
  assert.equal(m.plinthesM, 14);
});

test("ouverture sans position, allège négative ou hauteur nulle : signalée", () => {
  for (const changement of [{ positionMm: Number.NaN }, { alleMm: -10 }, { hauteurMm: 0 }, { largeurMm: undefined }]) {
    const piece = ajouterOuverture(salon(), { ...creerOuverture({ id: "o", type: "fenetre", murIndex: 0, positionMm: 500 }), ...changement });
    assert.deepEqual(codes(calculerMetres(piece)), ["OUVERTURE_DIMENSION_INVALIDE"], JSON.stringify(changement));
  }
});

test("hauteur sous plafond nulle ou absente : pièce non valide, valeurs null", () => {
  for (const hauteurMm of [0, -2500, Number.NaN, undefined]) {
    const m = calculerMetres({ ...salon(), hauteurMm });
    assert.equal(m.valide, false, String(hauteurMm));
    assert.ok(codes(m).includes("HAUTEUR_INVALIDE"));
    assert.equal(m.volumeM3, null);
  }
});

test("sommet en double : message « sommet en double », pas « murs qui se croisent »", () => {
  const piece = creerPiece({
    id: "d",
    sommets: [{ x: 0, y: 0 }, { x: 4000, y: 0 }, { x: 4000, y: 0 }, { x: 4000, y: 3000 }, { x: 0, y: 3000 }],
  });
  const m = calculerMetres(piece);
  assert.equal(m.valide, false);
  assert.deepEqual(codes(m), ["SOMMET_EN_DOUBLE"]);
});

test("niveau : la hauteur n'est pas additionnée ; murs et erreurs portent l'id de leur pièce", () => {
  const a = ajouterOuverture(salon(), creerOuverture({ id: "o", type: "porte", murIndex: 0, positionMm: -5 }));
  const b = creerPieceRectangulaire({ id: "q", longueurMm: 5000, largeurMm: 2000, hauteurMm: 2500 });
  const m = calculerMetresNiveau(creerNiveau({ pieces: [a, b] }));
  assert.equal(m.hauteurM, null);
  assert.deepEqual([...new Set(m.murs.map((mur) => mur.pieceId))], ["p", "q"]);
  assert.deepEqual(m.erreurs.map((e) => e.pieceId), ["p"]);
});

test("mur inexistant : une alerte « hors mur » par ouverture, pas de chevauchement fantôme", () => {
  let piece = salon();
  piece = ajouterOuverture(piece, creerOuverture({ id: "a", type: "fenetre", murIndex: 9, positionMm: 100, alleMm: 900 }));
  piece = ajouterOuverture(piece, creerOuverture({ id: "b", type: "fenetre", murIndex: 9, positionMm: 100, alleMm: 900 }));
  assert.deepEqual(codes(calculerMetres(piece)), ["OUVERTURE_HORS_MUR", "OUVERTURE_HORS_MUR"]);
});

test("métrés inchangés après avoir coupé un mur en deux (rectangle 4 × 3 m : 12,00 m² et 14,00 m)", () => {
  const coupe = insererSommet(salon(), 0, 0.5);
  assert.equal(coupe.ok, true);
  const m = calculerMetres(coupe.piece);
  assert.deepEqual(codes(m), []);
  assert.ok(Math.abs(m.solM2 - 12) < 1e-9 && Math.abs(m.perimetreM - 14) < 1e-9);
  assert.ok(Math.abs(m.mursBrutsM2 - 35) < 1e-9);
});

test("métrés inchangés après avoir retiré un sommet aligné (6 sommets, puis 5)", () => {
  const six = insererSommet(insererSommet(salon(), 0, 0.5).piece, 2, 0.5).piece;
  const retire = supprimerSommet(six, 1);
  assert.equal(retire.ok, true);
  const m = calculerMetres(retire.piece);
  assert.ok(Math.abs(m.solM2 - 12) < 1e-9 && Math.abs(m.perimetreM - 14) < 1e-9);
});

test("couper un mur biais garde des positions d'ouverture entières (R28)", () => {
  let triangle = creerPiece({ id: "t", sommets: [{ x: 0, y: 0 }, { x: 1000, y: 1000 }, { x: 0, y: 2000 }] });
  triangle = ajouterOuverture(triangle, creerOuverture({ id: "f", type: "fenetre", murIndex: 0, positionMm: 800, largeurMm: 300 }));
  const coupe = insererSommet(triangle, 0, 0.5); // le mur de 1414,2 mm est coupé à 707,1 mm
  assert.equal(coupe.ok, true);
  const f = coupe.piece.ouvertures[0];
  assert.equal(Number.isInteger(f.positionMm), true);
  assert.equal(f.murIndex, 1);
});

test("fixer une longueur sur un mur à 45° : écart inférieur à 1 mm ; longueur nulle ou NaN refusée", () => {
  const triangle = creerPiece({ id: "t", sommets: [{ x: 0, y: 0 }, { x: 3000, y: 3000 }, { x: 0, y: 4000 }] });
  const r = definirLongueurMur(triangle, 0, 1000);
  assert.equal(r.ok, true);
  const [a, b] = r.piece.sommets;
  assert.ok(Math.abs(Math.hypot(b.x - a.x, b.y - a.y) - 1000) < 1);
  assert.equal(definirLongueurMur(triangle, 0, 0).ok, false);
  assert.equal(definirLongueurMur(triangle, 0, Number.NaN).ok, false);
});

test("aller-retour d'un champ : 2,045 m ne devient pas 2,05 m", () => {
  assert.equal(texteDepuisMm(2045, "m"), "2,045");
  assert.deepEqual(analyserLongueur(texteDepuisMm(2045, "m"), "m"), { ok: true, mm: 2045 });
  assert.equal(texteDepuisMm(4000, "m"), "4,00");
  assert.equal(texteDepuisMm(3162.277, "m"), "3,162");
});
