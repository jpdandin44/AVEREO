import test from "node:test";
import assert from "node:assert/strict";
import {
  ajouterNiveau, ajouterOuverture, ajouterPiece, creerBatiment, creerNiveau, creerOuverture, creerPiece, creerPieceRectangulaire,
} from "../src/domain/modele.js";
import { aplatirBatiment } from "../src/sync/objets.js";
import { assemblerBatiment } from "../src/sync/assembler.js";

function rectangle(id = "piece-1") {
  return creerPieceRectangulaire({ id, nom: "Salon", longueurMm: 4000, largeurMm: 3000, hauteurMm: 2500 });
}

function batiment(piece) {
  return ajouterNiveau(creerBatiment({ id: "batiment-1", nom: "Maison" }),
    ajouterPiece(creerNiveau({ id: "niveau-1", nom: "RDC" }), piece));
}

function ref2() {
  let piece = ajouterOuverture(rectangle(), creerOuverture({ id: "ouv-1", type: "porte", murIndex: 0, positionMm: 500 }));
  return batiment(ajouterOuverture(piece, creerOuverture({ id: "ouv-2", type: "fenetre", murIndex: 1, positionMm: 900 })));
}

function plusieursNiveaux() {
  let maison = creerBatiment({ id: "batiment-1", nom: "Maison" });
  for (const suffixe of ["z", "a"]) {
    let niveau = creerNiveau({ id: `niveau-${suffixe}`, nom: suffixe });
    niveau = ajouterPiece(niveau, rectangle(`piece-${suffixe}-z`));
    niveau = ajouterPiece(niveau, rectangle(`piece-${suffixe}-a`));
    maison = ajouterNiveau(maison, niveau);
  }
  return maison;
}

const locaux = (b) => aplatirBatiment(b).map((objet) => ({ ...objet, rev: 1, deleted: false }));

const references = [
  ["REF-1", () => batiment(rectangle())],
  ["REF-2", ref2],
  ["REF-3", () => batiment(creerPiece({ id: "piece-l", nom: "En L", hauteurMm: 2500, sommets: [
    { x: 0, y: 0 }, { x: 4000, y: 0 }, { x: 4000, y: 2000 },
    { x: 2000, y: 2000 }, { x: 2000, y: 4000 }, { x: 0, y: 4000 },
  ] }))],
  ["deux niveaux avec plusieurs pièces, dans leur ordre", plusieursNiveaux],
];

for (const [nom, creer] of references) {
  test(`aller-retour exact : ${nom}`, () => {
    const attendu = creer();
    assert.deepEqual(assemblerBatiment(locaux(attendu)), { batiment: attendu, avertissements: [], orphelins: [] });
    assert.deepEqual(assemblerBatiment(locaux(attendu).reverse()).batiment, attendu);
  });
}

test("les objets supprimés sont ignorés lors de l'assemblage", () => {
  const objets = locaux(ref2()).map((objet) => objet.kind === "ouverture" ? { ...objet, deleted: true } : objet);
  assert.deepEqual(assemblerBatiment(objets), { batiment: batiment(rectangle()), avertissements: [], orphelins: [] });
});

test("un parent absent laisse la pièce et ses ouvertures orphelines, sans les afficher", () => {
  const objets = locaux(ref2()).filter((objet) => objet.kind !== "niveau");
  assert.deepEqual(assemblerBatiment(objets), {
    batiment: creerBatiment({ id: "batiment-1", nom: "Maison" }), avertissements: [], orphelins: ["ouv-1", "ouv-2", "piece-1"],
  });
});

test("un parent supprimé laisse ses descendants actifs orphelins et conservés", () => {
  const objets = locaux(ref2()).map((objet) => objet.kind === "piece" ? { ...objet, deleted: true } : objet);
  const resultat = assemblerBatiment(objets);
  assert.deepEqual(resultat.orphelins, ["ouv-1", "ouv-2"]);
  assert.deepEqual(resultat.batiment.niveaux[0].pieces, []);
  assert.equal(objets.filter((objet) => objet.kind === "ouverture").length, 2);
});

test("une ouverture dont le mur a disparu reste dans la pièce avec un avertissement", () => {
  const ouverture = creerOuverture({ id: "ouv-hors-plan", type: "porte", murIndex: 3, positionMm: 500 });
  const piece = ajouterOuverture(rectangle(), ouverture);
  const objets = locaux(batiment(piece)).map((objet) => objet.kind === "piece"
    ? { ...objet, data: { ...objet.data, sommets: objet.data.sommets.slice(0, 3) } } : objet);
  const resultat = assemblerBatiment(objets);
  assert.deepEqual(resultat.batiment.niveaux[0].pieces[0].ouvertures, [ouverture]);
  assert.deepEqual(resultat.avertissements, [{
    type: "ouverture-incoherente", ouvertureId: ouverture.id, pieceId: piece.id, message: "Ce mur n'existe pas.",
  }]);
});

test("toutes les ouvertures sont validées ensemble, y compris celles qui se chevauchent", () => {
  let piece = ajouterOuverture(rectangle(), creerOuverture({ id: "ouv-a", type: "porte", murIndex: 0, positionMm: 500 }));
  piece = ajouterOuverture(piece, creerOuverture({ id: "ouv-b", type: "porte", murIndex: 0, positionMm: 600 }));
  const resultat = assemblerBatiment(locaux(batiment(piece)));
  assert.equal(resultat.batiment.niveaux[0].pieces[0].ouvertures.length, 2);
  assert.deepEqual(resultat.avertissements.map((avertissement) => avertissement.ouvertureId), ["ouv-a", "ouv-b"]);
  assert.ok(resultat.avertissements.every((avertissement) => avertissement.message.includes("chevaucherait")));
});

test("deux pièces de même ordre sont triées par identifiant", () => {
  const maison = batiment(rectangle("piece-z"));
  maison.niveaux[0] = ajouterPiece(maison.niveaux[0], rectangle("piece-a"));
  const objets = locaux(maison).map((objet) => objet.kind === "piece" ? { ...objet, data: { ...objet.data, ordre: 0 } } : objet);
  assert.deepEqual(assemblerBatiment(objets).batiment.niveaux[0].pieces.map((piece) => piece.id), ["piece-a", "piece-z"]);
});

test("deux niveaux de même ordre sont triés par identifiant", () => {
  const objets = locaux(plusieursNiveaux()).map((objet) => objet.kind === "niveau" ? { ...objet, data: { ...objet.data, ordre: 0 } } : objet);
  assert.deepEqual(assemblerBatiment(objets).batiment.niveaux.map((niveau) => niveau.id), ["niveau-a", "niveau-z"]);
});

test("les ouvertures sont triées par identifiant indépendamment de leur ordre de réception", () => {
  const objets = locaux(ref2()).reverse();
  assert.deepEqual(assemblerBatiment(objets).batiment.niveaux[0].pieces[0].ouvertures.map((ouverture) => ouverture.id), ["ouv-1", "ouv-2"]);
});

test("le bâtiment préféré est choisi, sinon le premier identifiant actif", () => {
  const objets = ["batiment-z", "batiment-1", "batiment-a"].map((id) => ({
    id, kind: "batiment", parentId: null, data: { nom: id }, rev: 1, deleted: false,
  }));
  assert.equal(assemblerBatiment(objets).batiment.id, "batiment-1");
  assert.equal(assemblerBatiment(objets, "batiment-z").batiment.id, "batiment-z");
  assert.equal(assemblerBatiment(objets.slice(0, 1).concat(objets.slice(2)), "absent").batiment.id, "batiment-a");
  assert.equal(assemblerBatiment(objets.map((objet) => ({ ...objet, deleted: objet.id === "batiment-1" }))).batiment.id, "batiment-a");
});

test("sans bâtiment, le résultat est null et les objets détachés restent listés", () => {
  assert.deepEqual(assemblerBatiment([]), { batiment: null, avertissements: [], orphelins: [] });
  assert.deepEqual(assemblerBatiment(locaux(ref2()).filter((objet) => objet.kind !== "batiment")), {
    batiment: null, avertissements: [], orphelins: ["niveau-1", "ouv-1", "ouv-2", "piece-1"],
  });
});

test("l'assembleur ne modifie ni la liste locale ni ses données imbriquées", () => {
  const objets = locaux(ref2()).reverse();
  const copie = structuredClone(objets);
  const resultat = assemblerBatiment(objets);
  assert.deepEqual(objets, copie);
  resultat.batiment.niveaux[0].pieces[0].sommets[0].x = 123;
  resultat.batiment.niveaux[0].pieces[0].ouvertures[0].largeurMm = 100;
  assert.deepEqual(objets, copie);
});
