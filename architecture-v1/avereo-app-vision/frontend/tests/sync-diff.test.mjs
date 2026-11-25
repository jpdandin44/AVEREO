import test from "node:test";
import assert from "node:assert/strict";
import {
  ajouterNiveau, ajouterOuverture, ajouterPiece, creerBatiment, creerNiveau, creerOuverture, creerPieceRectangulaire,
  deplacerSommet, remplacerNiveau, remplacerPiece,
} from "../src/domain/modele.js";
import { aplatirBatiment } from "../src/sync/objets.js";
import { diffBatiment } from "../src/sync/diff.js";

function reference(avecOuvertures = false) {
  let piece = creerPieceRectangulaire({ id: "piece-1", nom: "Salon", longueurMm: 4000, largeurMm: 3000, hauteurMm: 2500 });
  if (avecOuvertures) {
    piece = ajouterOuverture(piece, creerOuverture({ id: "ouv-1", type: "porte", murIndex: 0, positionMm: 500 }));
    piece = ajouterOuverture(piece, creerOuverture({ id: "ouv-2", type: "fenetre", murIndex: 1, positionMm: 900 }));
  }
  return ajouterNiveau(creerBatiment({ id: "batiment-1", nom: "Maison" }),
    ajouterPiece(creerNiveau({ id: "niveau-1", nom: "RDC" }), piece));
}

function remplacerSalon(batiment, piece) {
  return remplacerNiveau(batiment, remplacerPiece(batiment.niveaux[0], piece));
}

test("un état initial null crée tous les objets de REF-2, parents avant enfants", () => {
  const batiment = reference(true);
  assert.deepEqual(diffBatiment(null, batiment), aplatirBatiment(batiment).map(({ id, ...objet }) => ({
    objectId: id, ...objet, deleted: false,
  })));
});

test("deux bâtiments identiques, même copiés, ne produisent aucun changement", () => {
  const batiment = reference(true);
  assert.deepEqual(diffBatiment(batiment, batiment), []);
  assert.deepEqual(diffBatiment(batiment, structuredClone(batiment)), []);
});

test("renommer une pièce produit uniquement sa mise à jour", () => {
  const avant = reference();
  const apres = remplacerSalon(avant, { ...avant.niveaux[0].pieces[0], nom: "Séjour" });
  assert.deepEqual(diffBatiment(avant, apres), [{
    objectId: "piece-1", kind: "piece", parentId: "niveau-1", deleted: false,
    data: { ...aplatirBatiment(avant)[2].data, nom: "Séjour" },
  }]);
});

test("déplacer un sommet met à jour uniquement la pièce et conserve les ouvertures", () => {
  const avant = reference(true);
  const apres = remplacerSalon(avant, deplacerSommet(avant.niveaux[0].pieces[0], 1, { x: 4500, y: 0 }));
  const changements = diffBatiment(avant, apres);
  assert.equal(changements.length, 1);
  assert.equal(changements[0].objectId, "piece-1");
  assert.equal(changements[0].deleted, false);
  assert.deepEqual(changements[0].data.sommets[1], { x: 4500, y: 0 });
});

test("ajouter une ouverture produit une seule création", () => {
  const avant = reference();
  const ouverture = creerOuverture({ id: "ouv-1", type: "porte", murIndex: 0, positionMm: 500 });
  const apres = remplacerSalon(avant, ajouterOuverture(avant.niveaux[0].pieces[0], ouverture));
  assert.deepEqual(diffBatiment(avant, apres), [{
    objectId: "ouv-1", kind: "ouverture", parentId: "piece-1", deleted: false,
    data: { type: "porte", murIndex: 0, positionMm: 500, largeurMm: 900, hauteurMm: 2040, alleMm: 0 },
  }]);
});

test("supprimer la pièce de REF-2 supprime ses deux ouvertures avant leur parent", () => {
  const avant = reference(true);
  const apres = remplacerNiveau(avant, creerNiveau({ id: "niveau-1", nom: "RDC" }));
  const changements = diffBatiment(avant, apres);
  assert.equal(changements.length, 3);
  assert.deepEqual(new Set(changements.slice(0, 2).map((objet) => objet.objectId)), new Set(["ouv-1", "ouv-2"]));
  assert.deepEqual(changements[2], { objectId: "piece-1", kind: "piece", parentId: "niveau-1", data: null, deleted: true });
  for (const changement of changements) {
    assert.equal(changement.deleted, true);
    assert.equal(changement.data, null);
  }
});

test("supprimer un niveau supprime aussi pièces et ouvertures, enfants avant parents", () => {
  const avant = reference(true);
  const changements = diffBatiment(avant, creerBatiment({ id: avant.id, nom: avant.nom }));
  assert.deepEqual(changements.map((objet) => objet.objectId), ["ouv-2", "ouv-1", "piece-1", "niveau-1"]);
});

test("déplacer une pièce entre deux niveaux produit une seule mise à jour de parentId", () => {
  const avant = ajouterNiveau(reference(true), creerNiveau({ id: "niveau-2", nom: "Étage" }));
  const piece = avant.niveaux[0].pieces[0];
  let apres = remplacerNiveau(avant, creerNiveau({ id: "niveau-1", nom: "RDC" }));
  apres = remplacerNiveau(apres, ajouterPiece(apres.niveaux[1], piece));
  assert.deepEqual(diffBatiment(avant, apres), [{
    objectId: piece.id, kind: "piece", parentId: "niveau-2", data: aplatirBatiment(avant)[2].data, deleted: false,
  }]);
});

test("réordonner deux pièces produit leurs mises à jour d'ordre", () => {
  const initial = reference();
  const niveau = ajouterPiece(initial.niveaux[0], creerPieceRectangulaire({ id: "piece-2", longueurMm: 2000, largeurMm: 3000 }));
  const avant = remplacerNiveau(initial, niveau);
  const apres = remplacerNiveau(avant, { ...niveau, pieces: niveau.pieces.slice().reverse() });
  const changements = diffBatiment(avant, apres);
  assert.deepEqual(changements.map((objet) => [objet.objectId, objet.data.ordre]), [["piece-2", 0], ["piece-1", 1]]);
});

test("des bâtiments d'identifiants différents sont acceptés, créations avant suppressions", () => {
  const avant = reference(true);
  const apres = creerBatiment({ id: "batiment-neuf", nom: "Annexe" });
  const changements = diffBatiment(avant, apres);
  assert.deepEqual(changements[0], { objectId: "batiment-neuf", kind: "batiment", parentId: null, data: { nom: "Annexe" }, deleted: false });
  assert.deepEqual(changements.slice(1).map((objet) => objet.objectId), ["ouv-2", "ouv-1", "piece-1", "niveau-1", "batiment-1"]);
  assert.ok(changements.slice(1).every((objet) => objet.deleted && objet.data === null));
});

test("le diff ne modifie aucun argument ni les sommets imbriqués", () => {
  const avant = reference(true);
  const apres = remplacerSalon(avant, deplacerSommet(avant.niveaux[0].pieces[0], 1, { x: 4500, y: 0 }));
  const copies = structuredClone({ avant, apres });
  const changements = diffBatiment(avant, apres);
  assert.deepEqual({ avant, apres }, copies);
  changements[0].data.sommets[0].x = 99;
  assert.deepEqual({ avant, apres }, copies);
});
