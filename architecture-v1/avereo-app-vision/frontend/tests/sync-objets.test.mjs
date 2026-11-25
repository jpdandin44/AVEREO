import test from "node:test";
import assert from "node:assert/strict";
import {
  ajouterNiveau, ajouterOuverture, ajouterPiece, creerBatiment, creerNiveau, creerOuverture, creerPieceRectangulaire,
} from "../src/domain/modele.js";
import { aplatirBatiment, memeContenu } from "../src/sync/objets.js";

function reference(avecOuvertures = false) {
  let piece = creerPieceRectangulaire({ id: "piece-1", nom: "Salon", longueurMm: 4000, largeurMm: 3000, hauteurMm: 2500 });
  if (avecOuvertures) {
    piece = ajouterOuverture(piece, creerOuverture({ id: "ouv-1", type: "porte", murIndex: 0, positionMm: 500 }));
    piece = ajouterOuverture(piece, creerOuverture({ id: "ouv-2", type: "fenetre", murIndex: 1, positionMm: 900 }));
  }
  return ajouterNiveau(creerBatiment({ id: "batiment-1", nom: "Maison" }),
    ajouterPiece(creerNiveau({ id: "niveau-1", nom: "RDC" }), piece));
}

test("REF-1 : exactement trois objets, aux données exactes et parents avant enfants", () => {
  assert.deepEqual(aplatirBatiment(reference()), [
    { id: "batiment-1", kind: "batiment", parentId: null, data: { nom: "Maison" } },
    { id: "niveau-1", kind: "niveau", parentId: "batiment-1", data: { nom: "RDC", ordre: 0 } },
    { id: "piece-1", kind: "piece", parentId: "niveau-1", data: {
      nom: "Salon", hauteurMm: 2500, ordre: 0,
      sommets: [{ x: 0, y: 0 }, { x: 4000, y: 0 }, { x: 4000, y: 3000 }, { x: 0, y: 3000 }],
    } },
  ]);
});

test("REF-2 : exactement cinq objets, porte et fenêtre avec les seules clés du contrat", () => {
  const objets = aplatirBatiment(reference(true));
  assert.equal(objets.length, 5);
  assert.deepEqual(objets.slice(0, 3), aplatirBatiment(reference()));
  assert.deepEqual(objets.slice(3), [
    { id: "ouv-1", kind: "ouverture", parentId: "piece-1", data: {
      type: "porte", murIndex: 0, positionMm: 500, largeurMm: 900, hauteurMm: 2040, alleMm: 0,
    } },
    { id: "ouv-2", kind: "ouverture", parentId: "piece-1", data: {
      type: "fenetre", murIndex: 1, positionMm: 900, largeurMm: 1200, hauteurMm: 1000, alleMm: 900,
    } },
  ]);
});

test("l'aplatissement exclut les métadonnées et copie les sommets sans modifier le domaine", () => {
  const batiment = reference(true);
  batiment.note = "privé";
  batiment.niveaux[0].note = "privé";
  const piece = batiment.niveaux[0].pieces[0];
  piece.note = "privé";
  piece.sommets[0].note = "privé";
  piece.ouvertures[0].note = "privé";
  const copie = structuredClone(batiment);
  const objets = aplatirBatiment(batiment);
  assert.deepEqual(objets, aplatirBatiment(reference(true)));
  assert.deepEqual(batiment, copie);
  assert.notStrictEqual(objets[2].data.sommets, piece.sommets);
  assert.notStrictEqual(objets[2].data.sommets[0], piece.sommets[0]);
  objets[2].data.sommets[0].x = 100;
  assert.deepEqual(batiment, copie);
});

test("même contenu : l'ordre des clés, même dans les sommets, est indifférent", () => {
  const a = { parentId: "n", deleted: false, data: { nom: "Salon", sommets: [{ x: 0, y: 10 }] } };
  const b = { data: { sommets: [{ y: 10, x: 0 }], nom: "Salon" }, deleted: false, parentId: "n" };
  assert.equal(memeContenu(a, b), true);
  assert.equal(memeContenu({ parentId: null, deleted: true, data: null }, { parentId: null, deleted: true, data: null }), true);
});

test("même contenu : parent, suppression, clés et valeurs imbriquées participent à l'égalité", () => {
  const objet = { parentId: "n", deleted: false, data: { nom: "Salon", sommets: [{ x: 0, y: 10 }] } };
  assert.equal(memeContenu(objet, { ...objet, parentId: "autre" }), false);
  assert.equal(memeContenu(objet, { ...objet, deleted: true }), false);
  assert.equal(memeContenu(objet, { ...objet, data: null }), false);
  assert.equal(memeContenu(objet, { ...objet, data: { ...objet.data, ordre: 0 } }), false);
  assert.equal(memeContenu(objet, { ...objet, data: { nom: "Salon", sommets: [{ x: 0, y: "10" }] } }), false);
  assert.equal(memeContenu(objet, { ...objet, data: { nom: "Salon", sommets: [{ x: 0, z: 10 }] } }), false);
});

test("même contenu : l'ordre et la longueur des tableaux restent significatifs", () => {
  const objet = { parentId: "n", deleted: false, data: { sommets: [{ x: 0, y: 0 }, { x: 10, y: 0 }] } };
  assert.equal(memeContenu(objet, { ...objet, data: { sommets: objet.data.sommets.slice().reverse() } }), false);
  assert.equal(memeContenu(objet, { ...objet, data: { sommets: objet.data.sommets.slice(0, 1) } }), false);
  assert.equal(memeContenu(objet, { ...objet, data: { sommets: { 0: objet.data.sommets[0], 1: objet.data.sommets[1] } } }), false);
});
