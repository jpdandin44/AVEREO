import test from "node:test";
import assert from "node:assert/strict";
import { calculerMetres, calculerMetresNiveau } from "../src/domain/metres.js";
import { creerPiece, creerPieceRectangulaire, creerOuverture, creerNiveau } from "../src/domain/modele.js";

const TOLERANCE = 1e-9;
const CHAMPS_NUMERIQUES = [
  "solM2", "perimetreM", "hauteurM", "plafondM2", "mursBrutsM2",
  "volumeM3", "ouverturesM2", "mursNetsM2", "plinthesM",
];

function proches(actual, attendu, nom = "valeur") {
  assert.equal(typeof actual, "number", nom);
  assert.ok(Math.abs(actual - attendu) <= TOLERANCE, `${nom} : ${actual} au lieu de ${attendu}`);
}

function verifierValeurs(metres, attendues) {
  for (const [champ, attendu] of Object.entries(attendues)) proches(metres[champ], attendu, champ);
}

function reference1(ouvertures = []) {
  return { ...creerPieceRectangulaire({ longueurMm: 4000, largeurMm: 3000, hauteurMm: 2500 }), ouvertures };
}

function reference3() {
  return creerPiece({
    hauteurMm: 2500,
    sommets: [
      { x: 0, y: 0 }, { x: 5000, y: 0 }, { x: 5000, y: 2000 },
      { x: 3000, y: 2000 }, { x: 3000, y: 4000 }, { x: 0, y: 4000 },
    ],
  });
}

function porte(changements = {}) {
  return creerOuverture({ id: "porte", type: "porte", murIndex: 0, positionMm: 500, ...changements });
}

function fenetre(changements = {}) {
  return creerOuverture({ id: "fenetre", type: "fenetre", murIndex: 1, positionMm: 900, ...changements });
}

function verifierContourInvalide(sommets, code) {
  const metres = calculerMetres(creerPiece({ sommets }));
  assert.equal(metres.valide, false);
  for (const champ of CHAMPS_NUMERIQUES) assert.equal(metres[champ], null, champ);
  assert.deepEqual(metres.murs, []);
  assert.ok(metres.erreurs.some((erreur) => erreur.code === code));
}

test("REF-1 : rectangle 4 × 3 m sans ouverture, hauteur 2,50 m", () => {
  const metres = calculerMetres(reference1());
  assert.equal(metres.valide, true);
  assert.deepEqual(metres.erreurs, []);
  verifierValeurs(metres, {
    solM2: 12, perimetreM: 14, hauteurM: 2.5, plafondM2: 12,
    mursBrutsM2: 35, volumeM3: 30, ouverturesM2: 0, mursNetsM2: 35, plinthesM: 14,
  });
  assert.equal(metres.murs.length, 4);
  for (const [index, longueurM] of [4, 3, 4, 3].entries()) {
    assert.equal(metres.murs[index].index, index);
    verifierValeurs(metres.murs[index], { longueurM, brutM2: longueurM * 2.5, ouverturesM2: 0, netM2: longueurM * 2.5 });
  }
});

test("REF-2 : porte et fenêtre déduites des murs, seule la porte réduit les plinthes", () => {
  const metres = calculerMetres(reference1([porte(), fenetre()]));
  assert.equal(metres.valide, true);
  assert.deepEqual(metres.erreurs, []);
  verifierValeurs(metres, {
    solM2: 12, perimetreM: 14, hauteurM: 2.5, plafondM2: 12,
    mursBrutsM2: 35, volumeM3: 30, ouverturesM2: 3.036, mursNetsM2: 31.964, plinthesM: 13.1,
  });
  verifierValeurs(metres.murs[0], { longueurM: 4, brutM2: 10, ouverturesM2: 1.836, netM2: 8.164 });
  verifierValeurs(metres.murs[1], { longueurM: 3, brutM2: 7.5, ouverturesM2: 1.2, netM2: 6.3 });
  verifierValeurs(metres.murs[2], { ouverturesM2: 0, netM2: 10 });
  verifierValeurs(metres.murs[3], { ouverturesM2: 0, netM2: 7.5 });
});

test("REF-3 : pièce concave en L", () => {
  const metres = calculerMetres(reference3());
  assert.equal(metres.valide, true);
  assert.deepEqual(metres.erreurs, []);
  verifierValeurs(metres, {
    solM2: 16, perimetreM: 18, hauteurM: 2.5, plafondM2: 16,
    mursBrutsM2: 45, volumeM3: 40, ouverturesM2: 0, mursNetsM2: 45, plinthesM: 18,
  });
  assert.deepEqual(metres.murs.map((mur) => mur.longueurM), [5, 2, 2, 2, 3, 4]);
});

test("REF-3 horaire : inverser le contour conserve tous les totaux", () => {
  const piece = reference3();
  const attendu = calculerMetres(piece);
  const inverse = calculerMetres({ ...piece, sommets: [...piece.sommets].reverse() });
  assert.equal(inverse.valide, true);
  assert.deepEqual(inverse.erreurs, []);
  for (const champ of CHAMPS_NUMERIQUES) proches(inverse[champ], attendu[champ], champ);
  assert.deepEqual(inverse.murs.map((mur) => mur.longueurM), [3, 2, 2, 2, 5, 4]);
});

test("aucun arrondi : une aire de 11,995 m² conserve sa précision interne", () => {
  const metres = calculerMetres(creerPieceRectangulaire({ longueurMm: 5000, largeurMm: 2399, hauteurMm: 2501 }));
  verifierValeurs(metres, {
    solM2: 11.995, plafondM2: 11.995, perimetreM: 14.798, hauteurM: 2.501,
    mursBrutsM2: 37.009798, volumeM3: 29.999495, mursNetsM2: 37.009798, plinthesM: 14.798,
  });
  assert.equal(metres.solM2, 11.995);
});

test("mur oblique : longueur et périmètre gardent la précision de la géométrie", () => {
  const metres = calculerMetres(creerPiece({ sommets: [{ x: 0, y: 0 }, { x: 1000, y: 0 }, { x: 0, y: 1000 }] }));
  assert.equal(metres.valide, true);
  assert.deepEqual(metres.erreurs, []);
  verifierValeurs(metres, { solM2: 0.5, perimetreM: 2 + Math.SQRT2, volumeM3: 1.25 });
  proches(metres.murs[1].longueurM, Math.SQRT2);
});

test("ouverture plus grande que le mur : alertes et métrés négatifs conservés", () => {
  const metres = calculerMetres(reference1([porte({ largeurMm: 20000 })]));
  assert.equal(metres.valide, true);
  assert.deepEqual(metres.erreurs.map(({ code }) => code), ["OUVERTURE_HORS_MUR", "OUVERTURES_SUPERIEURES_MUR"]);
  assert.equal(metres.erreurs[0].murIndex, 0);
  assert.equal(metres.erreurs[0].ouvertureId, "porte");
  assert.equal(metres.erreurs[1].murIndex, 0);
  verifierValeurs(metres, { ouverturesM2: 40.8, mursNetsM2: -5.8, plinthesM: -6 });
  verifierValeurs(metres.murs[0], { brutM2: 10, ouverturesM2: 40.8, netM2: -30.8 });
});

test("ouverture de position négative : hors du mur mais déduite intégralement", () => {
  const metres = calculerMetres(reference1([porte({ positionMm: -1 })]));
  assert.equal(metres.valide, true);
  assert.deepEqual(metres.erreurs.map(({ code, murIndex, ouvertureId }) => ({ code, murIndex, ouvertureId })), [
    { code: "OUVERTURE_HORS_MUR", murIndex: 0, ouvertureId: "porte" },
  ]);
  verifierValeurs(metres.murs[0], { ouverturesM2: 1.836, netM2: 8.164 });
});

test("mur inexistant : ouverture comptée dans les totaux mais dans aucun mur", () => {
  for (const murIndex of [-1, 4, 0.5]) {
    const metres = calculerMetres(reference1([porte({ murIndex })]));
    assert.equal(metres.valide, true);
    assert.deepEqual(metres.erreurs.map(({ code, murIndex, ouvertureId }) => ({ code, murIndex, ouvertureId })), [
      { code: "OUVERTURE_HORS_MUR", murIndex, ouvertureId: "porte" },
    ]);
    verifierValeurs(metres, { ouverturesM2: 1.836, mursNetsM2: 33.164, plinthesM: 13.1 });
    assert.deepEqual(metres.murs.map((mur) => mur.ouverturesM2), [0, 0, 0, 0]);
    proches(metres.murs.reduce((somme, mur) => somme + mur.netM2, 0), 35);
  }
});

test("fenêtre dépassant le plafond : allège incluse dans OUVERTURE_TROP_HAUTE", () => {
  const metres = calculerMetres(reference1([fenetre({ alleMm: 1501 })]));
  assert.equal(metres.valide, true);
  assert.deepEqual(metres.erreurs.map(({ code, murIndex, ouvertureId }) => ({ code, murIndex, ouvertureId })), [
    { code: "OUVERTURE_TROP_HAUTE", murIndex: 1, ouvertureId: "fenetre" },
  ]);
  verifierValeurs(metres, { ouverturesM2: 1.2, mursNetsM2: 33.8, plinthesM: 14 });
});

test("ouverture aux limites exactes du mur et du plafond : aucune alerte", () => {
  const metres = calculerMetres(reference1([fenetre({ positionMm: 1800, alleMm: 1500 })]));
  assert.equal(metres.valide, true);
  assert.deepEqual(metres.erreurs, []);
});

test("deux portes qui se chevauchent : alerte, surfaces et largeurs additionnées", () => {
  const metres = calculerMetres(reference1([porte(), porte({ id: "porte-2", positionMm: 1000 })]));
  assert.equal(metres.valide, true);
  assert.deepEqual(metres.erreurs.map(({ code }) => code), ["OUVERTURE_CHEVAUCHEMENT"]);
  assert.equal(metres.erreurs[0].murIndex, 0);
  verifierValeurs(metres, { ouverturesM2: 3.672, mursNetsM2: 31.328, plinthesM: 12.2 });
  verifierValeurs(metres.murs[0], { ouverturesM2: 3.672, netM2: 6.328 });
});

test("ouvertures imbriquées et non triées : chaque paire en recouvrement est signalée", () => {
  const metres = calculerMetres(reference1([
    porte({ id: "droite", positionMm: 2000 }),
    fenetre({ murIndex: 0, positionMm: 1000, largeurMm: 2500 }),
    porte({ id: "gauche", positionMm: 500 }),
  ]));
  assert.equal(metres.valide, true);
  assert.deepEqual(metres.erreurs.map(({ code }) => code), ["OUVERTURE_CHEVAUCHEMENT", "OUVERTURE_CHEVAUCHEMENT"]);
});

test("deux portes bord à bord : aucun chevauchement, quel que soit l'ordre", () => {
  const ouvertures = [porte(), porte({ id: "porte-2", positionMm: 1400 })];
  for (const ordre of [ouvertures, [...ouvertures].reverse()]) {
    const metres = calculerMetres(reference1(ordre));
    assert.equal(metres.valide, true);
    assert.deepEqual(metres.erreurs, []);
    verifierValeurs(metres, { ouverturesM2: 3.672, plinthesM: 12.2 });
  }
});

test("mêmes positions sur des murs différents : aucun chevauchement", () => {
  const metres = calculerMetres(reference1([porte(), porte({ id: "porte-2", murIndex: 1 })]));
  assert.deepEqual(metres.erreurs, []);
});

test("ouvertures égales à la surface brute du mur : net nul sans dépassement", () => {
  const metres = calculerMetres(reference1([porte({ positionMm: 0, largeurMm: 4000, hauteurMm: 2500 })]));
  assert.equal(metres.valide, true);
  assert.deepEqual(metres.erreurs, []);
  verifierValeurs(metres.murs[0], { ouverturesM2: 10, netM2: 0 });
});

test("plusieurs ouvertures : leur somme peut dépasser la surface du mur", () => {
  const metres = calculerMetres(reference1([
    porte({ positionMm: 0, largeurMm: 3000, hauteurMm: 2000 }),
    porte({ id: "porte-2", positionMm: 1000, largeurMm: 3000, hauteurMm: 2000 }),
  ]));
  assert.equal(metres.valide, true);
  assert.deepEqual(metres.erreurs.map(({ code }) => code), ["OUVERTURE_CHEVAUCHEMENT", "OUVERTURES_SUPERIEURES_MUR"]);
  verifierValeurs(metres.murs[0], { ouverturesM2: 12, netM2: -2 });
});

test("polygone auto-sécant en papillon : métrés invalides et valeurs null", () => {
  verifierContourInvalide([
    { x: 0, y: 0 }, { x: 4000, y: 3000 }, { x: 4000, y: 0 }, { x: 0, y: 3000 },
  ], "POLYGONE_AUTO_SECANT");
});

test("polygone auto-sécant d'aire non nulle : métrés également invalides", () => {
  verifierContourInvalide([
    { x: 0, y: 0 }, { x: 5000, y: 3000 }, { x: 4000, y: 0 }, { x: 0, y: 3000 },
  ], "POLYGONE_AUTO_SECANT");
});

test("moins de trois sommets : contour dégénéré, y compris un contour vide", () => {
  for (const sommets of [[], [{ x: 0, y: 0 }], [{ x: 0, y: 0 }, { x: 4000, y: 0 }]]) {
    verifierContourInvalide(sommets, "POLYGONE_DEGENERE");
  }
});

test("aire nulle avec trois sommets alignés : contour dégénéré", () => {
  verifierContourInvalide([{ x: 0, y: 0 }, { x: 2000, y: 0 }, { x: 4000, y: 0 }], "POLYGONE_DEGENERE");
});

test("niveau REF-1 + REF-3 : tous les champs numériques sont additionnés", () => {
  const metres = calculerMetresNiveau(creerNiveau({ pieces: [reference1(), reference3()] }));
  assert.equal(metres.valide, true);
  assert.deepEqual(metres.erreurs, []);
  verifierValeurs(metres, {
    solM2: 28, perimetreM: 32, hauteurM: 5, plafondM2: 28,
    mursBrutsM2: 80, volumeM3: 70, ouverturesM2: 0, mursNetsM2: 80, plinthesM: 32,
  });
  assert.equal(metres.murs.length, 10);
});

test("niveau vide : valide et toutes les valeurs à zéro", () => {
  const metres = calculerMetresNiveau(creerNiveau());
  assert.equal(metres.valide, true);
  for (const champ of CHAMPS_NUMERIQUES) assert.equal(metres[champ], 0, champ);
  assert.deepEqual(metres.murs, []);
  assert.deepEqual(metres.erreurs, []);
});

test("niveau avec ouvertures : addition des métrés et concaténation des erreurs", () => {
  const pieces = [reference1([porte({ positionMm: -1 })]), reference1([fenetre({ alleMm: 1501 })])];
  const metres = calculerMetresNiveau(creerNiveau({ pieces }));
  assert.equal(metres.valide, true);
  verifierValeurs(metres, { ouverturesM2: 3.036, mursNetsM2: 66.964, plinthesM: 27.1 });
  assert.deepEqual(metres.erreurs, pieces.flatMap((piece) => calculerMetres(piece).erreurs));
  assert.deepEqual(metres.murs, pieces.flatMap((piece) => calculerMetres(piece).murs));
});

test("niveau avec une pièce invalide : totaux null, erreurs conservées dans les deux ordres", () => {
  const valide = reference1([porte({ positionMm: -1 })]);
  const invalide = creerPiece({ sommets: [] });
  for (const pieces of [[valide, invalide], [invalide, valide]]) {
    const metres = calculerMetresNiveau(creerNiveau({ pieces }));
    assert.equal(metres.valide, false);
    for (const champ of CHAMPS_NUMERIQUES) assert.equal(metres[champ], null, champ);
    assert.deepEqual(metres.erreurs, pieces.flatMap((piece) => calculerMetres(piece).erreurs));
  }
});

test("logique pure : les pièces, sommets, ouvertures et niveaux restent inchangés", () => {
  const piece = reference1([porte({ positionMm: 1500 }), porte({ id: "porte-2", positionMm: 500 })]);
  const niveau = creerNiveau({ pieces: [piece, reference3()] });
  const avant = structuredClone(niveau);
  for (const p of niveau.pieces) {
    for (const sommet of p.sommets) Object.freeze(sommet);
    for (const ouverture of p.ouvertures) Object.freeze(ouverture);
    Object.freeze(p.sommets);
    Object.freeze(p.ouvertures);
    Object.freeze(p);
  }
  Object.freeze(niveau.pieces);
  Object.freeze(niveau);
  assert.deepEqual(calculerMetres(piece), calculerMetres(piece));
  assert.equal(calculerMetresNiveau(niveau).valide, true);
  assert.deepEqual(niveau, avant);
});

test("chaque erreur de métré possède un code connu et un message français", () => {
  const pieces = [
    creerPiece({ sommets: [] }),
    creerPiece({ sommets: [{ x: 0, y: 0 }, { x: 4000, y: 3000 }, { x: 4000, y: 0 }, { x: 0, y: 3000 }] }),
    reference1([porte({ largeurMm: 20000 }), fenetre({ murIndex: 0, alleMm: 2000 })]),
  ];
  const erreurs = pieces.flatMap((piece) => calculerMetres(piece).erreurs);
  assert.deepEqual(new Set(erreurs.map(({ code }) => code)), new Set([
    "POLYGONE_DEGENERE", "POLYGONE_AUTO_SECANT", "OUVERTURE_HORS_MUR",
    "OUVERTURE_TROP_HAUTE", "OUVERTURE_CHEVAUCHEMENT", "OUVERTURES_SUPERIEURES_MUR",
  ]));
  for (const erreur of erreurs) assert.ok(typeof erreur.message === "string" && erreur.message.length > 0);
});
