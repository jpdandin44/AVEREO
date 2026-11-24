import test from "node:test";
import assert from "node:assert/strict";
import {
  ajouterNiveau,
  ajouterOuverture,
  ajouterPiece,
  creerBatiment,
  creerNiveau,
  creerOuverture,
  creerPiece,
  creerPieceRectangulaire,
  definirLongueurMur,
  deplacerSommet,
  estRectangleAxes,
  insererSommet,
  longueurMur,
  modifierOuverture,
  nombreMurs,
  redimensionnerRectangle,
  remplacerNiveau,
  remplacerPiece,
  supprimerOuverture,
  supprimerPiece,
  supprimerSommet,
} from "../src/domain/modele.js";

const salon = () => creerPieceRectangulaire({ id: "p1", nom: "Salon", longueurMm: 4000, largeurMm: 3000, hauteurMm: 2500 });

test("pièce rectangulaire : 4 murs de 4, 3, 4, 3 m", () => {
  const piece = salon();
  assert.equal(nombreMurs(piece), 4);
  assert.deepEqual([0, 1, 2, 3].map((i) => longueurMur(piece, i)), [4000, 3000, 4000, 3000]);
  assert.equal(estRectangleAxes(piece), true);
});

test("les fonctions ne modifient jamais leurs arguments", () => {
  const piece = salon();
  const copie = JSON.parse(JSON.stringify(piece));
  deplacerSommet(piece, 1, { x: 4500, y: 0 });
  ajouterOuverture(piece, creerOuverture({ id: "o1", type: "porte", murIndex: 0, positionMm: 500 }));
  insererSommet(piece, 0);
  assert.deepEqual(piece, copie);
});

test("ouvertures : dimensions par défaut d'une porte et d'une fenêtre", () => {
  const porte = creerOuverture({ id: "o1", type: "porte", murIndex: 0, positionMm: 500 });
  assert.deepEqual([porte.largeurMm, porte.hauteurMm, porte.alleMm], [900, 2040, 0]);
  const fenetre = creerOuverture({ id: "o2", type: "fenetre", murIndex: 1, positionMm: 900 });
  assert.deepEqual([fenetre.largeurMm, fenetre.hauteurMm, fenetre.alleMm], [1200, 1000, 900]);
});

test("ajout, modification et suppression d'une ouverture", () => {
  let piece = salon();
  piece = ajouterOuverture(piece, creerOuverture({ id: "o1", type: "porte", murIndex: 0, positionMm: 500 }));
  piece = modifierOuverture(piece, "o1", { positionMm: 700, id: "autre" });
  assert.equal(piece.ouvertures[0].positionMm, 700);
  assert.equal(piece.ouvertures[0].id, "o1");
  piece = supprimerOuverture(piece, "o1");
  assert.equal(piece.ouvertures.length, 0);
});

test("redimensionner un rectangle", () => {
  const piece = redimensionnerRectangle(salon(), 5000, 3500);
  assert.deepEqual([0, 1, 2, 3].map((i) => longueurMur(piece, i)), [5000, 3500, 5000, 3500]);
});

test("fixer la longueur d'un mur déplace son extrémité le long du mur", () => {
  const resultat = definirLongueurMur(salon(), 0, 4500);
  assert.equal(resultat.ok, true);
  assert.equal(longueurMur(resultat.piece, 0), 4500);
  assert.deepEqual(resultat.piece.sommets[1], { x: 4500, y: 0 });
});

test("fixer une longueur qui ferait se croiser les murs est refusé", () => {
  // Raccourcir le mur 0 jusqu'à replier le mur 1 sur le mur 3 reste valide ; l'allonger au point de traverser un autre mur non.
  const enL = creerPiece({
    id: "l",
    sommets: [
      { x: 0, y: 0 },
      { x: 5000, y: 0 },
      { x: 5000, y: 2000 },
      { x: 3000, y: 2000 },
      { x: 3000, y: 4000 },
      { x: 0, y: 4000 },
    ],
  });
  const resultat = definirLongueurMur(enL, 3, 5000); // le mur 3 irait de (3000;2000) à (3000;7000)...
  assert.equal(resultat.ok, true); // sans croisement ici
  const croise = definirLongueurMur(enL, 2, 7000); // (5000;2000) → (-2000;2000) traverse le mur 4
  assert.equal(croise.ok, false);
});

test("insérer un sommet coupe le mur en deux et répartit les ouvertures", () => {
  let piece = salon();
  piece = ajouterOuverture(piece, creerOuverture({ id: "gauche", type: "porte", murIndex: 0, positionMm: 100, largeurMm: 900 }));
  piece = ajouterOuverture(piece, creerOuverture({ id: "droite", type: "fenetre", murIndex: 0, positionMm: 2500, largeurMm: 1200 }));
  piece = ajouterOuverture(piece, creerOuverture({ id: "ailleurs", type: "fenetre", murIndex: 1, positionMm: 500 }));
  const resultat = insererSommet(piece, 0, 0.5); // coupe le mur de 4 m à 2 m
  assert.equal(resultat.ok, true);
  const apres = resultat.piece;
  assert.equal(nombreMurs(apres), 5);
  const parId = Object.fromEntries(apres.ouvertures.map((o) => [o.id, o]));
  assert.deepEqual([parId.gauche.murIndex, parId.gauche.positionMm], [0, 100]);
  assert.deepEqual([parId.droite.murIndex, parId.droite.positionMm], [1, 500]);
  assert.equal(parId.ailleurs.murIndex, 2);
});

test("insérer un sommet sous une ouverture à cheval est refusé", () => {
  let piece = salon();
  piece = ajouterOuverture(piece, creerOuverture({ id: "o1", type: "porte", murIndex: 0, positionMm: 1700, largeurMm: 900 }));
  const resultat = insererSommet(piece, 0, 0.5);
  assert.equal(resultat.ok, false);
  assert.ok(resultat.message.length > 0);
});

test("supprimer un sommet : au moins 3 murs, pas d'ouverture sur les murs voisins", () => {
  const triangle = creerPiece({ id: "t", sommets: [{ x: 0, y: 0 }, { x: 4000, y: 0 }, { x: 0, y: 3000 }] });
  assert.equal(supprimerSommet(triangle, 0).ok, false);

  const piece = ajouterOuverture(salon(), creerOuverture({ id: "o1", type: "porte", murIndex: 0, positionMm: 500 }));
  assert.equal(supprimerSommet(piece, 1).ok, false); // le mur 0 porte une ouverture
  assert.equal(supprimerSommet(piece, 3).ok, true); // murs 2 et 3 sans ouverture
});

test("supprimer un sommet décale l'index des murs suivants", () => {
  const hexagone = creerPiece({
    id: "h",
    sommets: [
      { x: 0, y: 0 },
      { x: 5000, y: 0 },
      { x: 5000, y: 2000 },
      { x: 3000, y: 2000 },
      { x: 3000, y: 4000 },
      { x: 0, y: 4000 },
    ],
    ouvertures: [creerOuverture({ id: "o", type: "fenetre", murIndex: 5, positionMm: 500 })],
  });
  const resultat = supprimerSommet(hexagone, 2); // fusionne les murs 1 et 2
  assert.equal(resultat.ok, true);
  assert.equal(nombreMurs(resultat.piece), 5);
  assert.equal(resultat.piece.ouvertures[0].murIndex, 4);
});

test("niveaux et bâtiment : ajout, remplacement, suppression", () => {
  let niveau = creerNiveau({ id: "n0", nom: "Rez-de-chaussée" });
  niveau = ajouterPiece(niveau, salon());
  const modifiee = { ...salon(), nom: "Séjour" };
  niveau = remplacerPiece(niveau, modifiee);
  assert.equal(niveau.pieces[0].nom, "Séjour");
  let batiment = ajouterNiveau(creerBatiment({ id: "b", nom: "Maison" }), niveau);
  batiment = remplacerNiveau(batiment, supprimerPiece(niveau, "p1"));
  assert.equal(batiment.niveaux[0].pieces.length, 0);
});
