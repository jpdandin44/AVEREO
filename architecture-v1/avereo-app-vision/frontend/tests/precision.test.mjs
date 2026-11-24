import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  TOLERANCE_MM,
  MODES,
  longueursAffichees,
  comparerAuReleveLaser,
  etatPrecision,
  evaluerPieceReference,
} from "../src/domain/precision.js";

function rectangle() {
  return {
    id: "rectangle",
    nom: "Rectangle",
    hauteurMm: 2500,
    sommets: [{ x: 0, y: 0 }, { x: 4000, y: 0 }, { x: 4000, y: 3000 }, { x: 0, y: 3000 }],
    ouvertures: [],
  };
}

test("R29 : rectangle 4000 × 3000 mm, hauteur 2500 mm et diagonales calculées de 5000 mm", () => {
  assert.deepEqual(longueursAffichees(rectangle()), [
    { nom: "mur 1", valeurMm: 4000, origine: "saisie" },
    { nom: "mur 2", valeurMm: 3000, origine: "saisie" },
    { nom: "mur 3", valeurMm: 4000, origine: "saisie" },
    { nom: "mur 4", valeurMm: 3000, origine: "saisie" },
    { nom: "hauteur", valeurMm: 2500, origine: "saisie" },
    { nom: "diagonale 1", valeurMm: 5000, origine: "calculee" },
    { nom: "diagonale 2", valeurMm: 5000, origine: "calculee" },
  ]);
});

test("R29 : les murs obliques et les diagonales utilisent les sommets, arrondis au millimètre", () => {
  const piece = rectangle();
  piece.sommets[2] = { x: 3000, y: 3000 };
  assert.deepEqual(longueursAffichees(piece).map(({ valeurMm }) => valeurMm), [
    4000, 3162, 3000, 3000, 2500, 4243, 5000,
  ]);
});

test("R29 : une pièce à six sommets n'a pas de diagonales dans le rapport", () => {
  const piece = rectangle();
  piece.sommets = [
    { x: 0, y: 0 }, { x: 4000, y: 0 }, { x: 4000, y: 2000 },
    { x: 2000, y: 2000 }, { x: 2000, y: 3000 }, { x: 0, y: 3000 },
  ];
  assert.deepEqual(longueursAffichees(piece), [
    { nom: "mur 1", valeurMm: 4000, origine: "saisie" },
    { nom: "mur 2", valeurMm: 2000, origine: "saisie" },
    { nom: "mur 3", valeurMm: 2000, origine: "saisie" },
    { nom: "mur 4", valeurMm: 1000, origine: "saisie" },
    { nom: "mur 5", valeurMm: 2000, origine: "saisie" },
    { nom: "mur 6", valeurMm: 3000, origine: "saisie" },
    { nom: "hauteur", valeurMm: 2500, origine: "saisie" },
  ]);
});

for (const ecart of [19, 20, 21]) {
  for (const signe of [-1, 1]) {
    const conforme = ecart <= 20;
    test(`R29 : écart ${ecart} mm ${conforme ? "accepté" : "refusé"} (laser à 4000 ${signe < 0 ? "−" : "+"} ${ecart} mm)`, () => {
      assert.equal(TOLERANCE_MM, 20);
      const laser = 4000 + signe * ecart;
      const resultat = comparerAuReleveLaser(
        [{ nom: "mur 1", valeurMm: 4000, origine: "saisie" }],
        { "mur 1": laser },
      );
      assert.equal(resultat.conforme, conforme);
      assert.equal(resultat.ecartMaxMm, ecart);
      assert.deepEqual(resultat.lignes, [
        { nom: "mur 1", origine: "saisie", calculeMm: 4000, laserMm: laser, ecartMm: ecart, conforme },
      ]);
      assert.deepEqual(resultat.sansReference, []);
      assert.deepEqual(resultat.parOrigine, {
        saisie: { nb: 1, nbHorsTolerance: conforme ? 0 : 1 },
        calculee: { nb: 0, nbHorsTolerance: 0 },
      });
    });
  }
}

test("R29 : toutes les longueurs sans cote laser sont listées et empêchent la conformité", () => {
  const resultat = comparerAuReleveLaser(longueursAffichees(rectangle()), { "mur 1": 4000 });
  assert.equal(resultat.conforme, false);
  assert.equal(resultat.lignes.length, 1);
  assert.equal(resultat.lignes[0].conforme, true);
  assert.deepEqual(resultat.sansReference, ["mur 2", "mur 3", "mur 4", "hauteur", "diagonale 1", "diagonale 2"]);
  assert.deepEqual(resultat.parOrigine, {
    saisie: { nb: 1, nbHorsTolerance: 0 },
    calculee: { nb: 0, nbHorsTolerance: 0 },
  });
});

test("R29 : aucune ligne comparée ne peut donner un résultat conforme", () => {
  for (const longueurs of [[], [{ nom: "mur 1", valeurMm: 4000, origine: "saisie" }]]) {
    const resultat = comparerAuReleveLaser(longueurs, {});
    assert.equal(resultat.conforme, false);
    assert.equal(resultat.ecartMaxMm, 0);
    assert.deepEqual(resultat.lignes, []);
    assert.deepEqual(resultat.sansReference, longueurs.map(({ nom }) => nom));
    assert.deepEqual(resultat.parOrigine, {
      saisie: { nb: 0, nbHorsTolerance: 0 },
      calculee: { nb: 0, nbHorsTolerance: 0 },
    });
  }
});

test("R29 : le rapport distingue les saisies et les calculs, y compris leurs écarts hors tolérance", () => {
  const resultat = comparerAuReleveLaser(longueursAffichees(rectangle()), {
    "mur 1": 4021, "mur 2": 3000, "mur 3": 4000, "mur 4": 3000,
    hauteur: 2500, "diagonale 1": 5021, "diagonale 2": 5000,
  });
  assert.equal(resultat.conforme, false);
  assert.equal(resultat.ecartMaxMm, 21);
  assert.deepEqual(resultat.parOrigine, {
    saisie: { nb: 5, nbHorsTolerance: 1 },
    calculee: { nb: 2, nbHorsTolerance: 1 },
  });
});

test("R29 : une cote laser égale à zéro reste une référence et la tolérance peut être ajustée", () => {
  const longueurs = [{ nom: "mur 1", valeurMm: 10, origine: "saisie" }];
  assert.equal(comparerAuReleveLaser(longueurs, { "mur 1": 0 }, 10).conforme, true);
  const resultat = comparerAuReleveLaser(longueurs, { "mur 1": 0 }, 9);
  assert.equal(resultat.conforme, false);
  assert.equal(resultat.lignes[0].ecartMm, 10);
  assert.deepEqual(resultat.sansReference, []);
});

const casCotesSaisies = [
  ["sans essai", undefined, "qualification_en_attente", "alerte"],
  ["essai conforme provisoire", { conforme: true, provisoire: true }, "qualification_en_attente", "alerte"],
  ["essai conforme non provisoire", { conforme: true, provisoire: false }, "tolerance_tenue", "info"],
  ["essai conforme sans marqueur provisoire", { conforme: true }, "tolerance_tenue", "info"],
  ["essai non conforme", { conforme: false, provisoire: false }, "qualification_en_attente", "alerte"],
  ["essai incomplet", {}, "qualification_en_attente", "alerte"],
];

function verifierTextePrecision(resultat) {
  assert.ok(["info", "alerte"].includes(resultat.icone));
  for (const texte of [resultat.titre, resultat.libelle]) {
    assert.ok(texte.trim().length > 0);
    assert.ok(texte.includes("±2 cm"));
    assert.doesNotMatch(texte, /couleur|rouge|vert|orange|bleu|#[0-9a-f]{3,8}\b/i);
  }
}

for (const [nom, resultatEssai, etat, icone] of casCotesSaisies) {
  test(`R30/R12 : cotes saisies, ${nom} → ${etat}`, () => {
    const resultat = resultatEssai === undefined
      ? etatPrecision(MODES.COTES_SAISIES)
      : etatPrecision(MODES.COTES_SAISIES, { resultatEssai });
    assert.equal(resultat.mode, MODES.COTES_SAISIES);
    assert.equal(resultat.etat, etat);
    assert.equal(resultat.icone, icone);
    verifierTextePrecision(resultat);
  });
}

for (const mode of [MODES.VIDEO, MODES.WEBXR]) {
  test(`R30/R12 : ${mode} reste non garanti, même avec un essai conforme non provisoire`, () => {
    for (const resultatEssai of [undefined, { conforme: true, provisoire: false }]) {
      const resultat = etatPrecision(mode, { resultatEssai });
      assert.equal(resultat.mode, mode);
      assert.equal(resultat.etat, "non_garantie");
      assert.equal(resultat.icone, "alerte");
      assert.match(resultat.libelle, /précision de ±2 cm non garantie/);
      verifierTextePrecision(resultat);
    }
  });
}

test("R30 : un mode de capture inconnu lève une Error", () => {
  assert.throws(() => etatPrecision("inconnu"), { name: "Error", message: /Mode de capture inconnu/ });
});

test("R29/R30 : le fichier de référence provisoire est conforme, sans qualifier les cotes saisies", () => {
  const reference = JSON.parse(readFileSync(new URL("../../docs/essais/piece-reference.json", import.meta.url), "utf8"));
  const avant = structuredClone(reference);
  assert.equal(reference.provisoire, true);
  assert.match(reference.avertissement, /À VÉRIFIER.*fictif/);
  const resultatEssai = evaluerPieceReference(reference);
  assert.equal(resultatEssai.provisoire, true);
  assert.equal(resultatEssai.conforme, true);
  assert.equal(resultatEssai.ecartMaxMm, 5);
  assert.deepEqual(resultatEssai.lignes.map(({ ecartMm }) => ecartMm), [5, 4, 2, 3, 2, 1, 3]);
  assert.deepEqual(resultatEssai.sansReference, []);
  assert.deepEqual(resultatEssai.parOrigine, {
    saisie: { nb: 5, nbHorsTolerance: 0 },
    calculee: { nb: 2, nbHorsTolerance: 0 },
  });
  assert.equal(etatPrecision(MODES.COTES_SAISIES, { resultatEssai }).etat, "qualification_en_attente");
  assert.equal(evaluerPieceReference(reference, 1).conforme, false);
  assert.deepEqual(reference, avant);
});

test("R29/R30 : un jeu non provisoire conserve son statut et les arguments restent inchangés", () => {
  const piece = rectangle();
  const longueurs = longueursAffichees(piece);
  const laserMm = { "mur 1": 4000, "mur 2": 3000, "mur 3": 4000, "mur 4": 3000,
    hauteur: 2500, "diagonale 1": 5000, "diagonale 2": 5000 };
  const reference = { piece, laserMm, provisoire: false };
  const avant = structuredClone({ reference, longueurs });
  const resultatEssai = evaluerPieceReference(reference);
  comparerAuReleveLaser(longueurs, laserMm);
  assert.equal(resultatEssai.provisoire, false);
  assert.equal(resultatEssai.conforme, true);
  assert.equal(etatPrecision(MODES.COTES_SAISIES, { resultatEssai }).etat, "tolerance_tenue");
  assert.deepEqual({ reference, longueurs }, avant);
});
