// Banc d'essai des longueurs en millimètres (R29) et états de précision par mode (R30).
// Logique pure : un jeu provisoire ne qualifie jamais la précision des cotes saisies.

import { distance, longueurMurMm } from "./geometrie.js";

/**
 * @typedef {import("./modele.js").Piece} Piece
 * @typedef {"saisie"|"calculee"} OrigineLongueur
 * @typedef {{nom: string, valeurMm: number, origine: OrigineLongueur}} LongueurAffichee
 * @typedef {{nom: string, origine: OrigineLongueur, calculeMm: number, laserMm: number,
 *   ecartMm: number, conforme: boolean}} LigneComparaison
 * @typedef {{nb: number, nbHorsTolerance: number}} BilanOrigine
 * @typedef {{conforme: boolean, ecartMaxMm: number, lignes: LigneComparaison[], sansReference: string[],
 *   parOrigine: Record<OrigineLongueur, BilanOrigine>}} ResultatComparaison
 * @typedef {ResultatComparaison & {provisoire: boolean}} ResultatEssai
 * @typedef {"qualification_en_attente"|"tolerance_tenue"|"non_garantie"} EtatPrecision
 * @typedef {{mode: string, etat: EtatPrecision, icone: "info"|"alerte", titre: string, libelle: string}} PrecisionMode
 */

export const TOLERANCE_MM = 20;
export const MODES = { COTES_SAISIES: "cotes-saisies", VIDEO: "video", WEBXR: "webxr" };

/**
 * Murs et hauteur issus de la saisie, puis diagonales calculées pour un contour à quatre sommets.
 * Toutes les longueurs sont arrondies au millimètre pour la comparaison.
 * @param {Piece} piece
 * @returns {LongueurAffichee[]}
 */
export function longueursAffichees(piece) {
  /** @type {LongueurAffichee[]} */
  const longueurs = piece.sommets.map((_, i) => ({
    nom: `mur ${i + 1}`,
    valeurMm: Math.round(longueurMurMm(piece.sommets, i)),
    origine: "saisie",
  }));
  longueurs.push({ nom: "hauteur", valeurMm: Math.round(piece.hauteurMm), origine: "saisie" });
  if (piece.sommets.length === 4) {
    for (let i = 0; i < 2; i += 1) {
      longueurs.push({
        nom: `diagonale ${i + 1}`,
        valeurMm: Math.round(distance(piece.sommets[i], piece.sommets[i + 2])),
        origine: "calculee",
      });
    }
  }
  return longueurs;
}

/**
 * Compare chaque longueur possédant une cote laser ; les références manquantes empêchent la conformité.
 * Les bilans par origine comptent uniquement les lignes comparées. Sans comparaison, l'écart maximal vaut 0.
 * @param {LongueurAffichee[]} longueurs
 * @param {Record<string, number>} laserMm
 * @param {number} [toleranceMm]
 * @returns {ResultatComparaison}
 */
export function comparerAuReleveLaser(longueurs, laserMm, toleranceMm = TOLERANCE_MM) {
  /** @type {LigneComparaison[]} */
  const lignes = [];
  /** @type {string[]} */
  const sansReference = [];
  const parOrigine = {
    saisie: { nb: 0, nbHorsTolerance: 0 },
    calculee: { nb: 0, nbHorsTolerance: 0 },
  };
  let ecartMaxMm = 0;
  for (const { nom, valeurMm, origine } of longueurs) {
    if (!Object.hasOwn(laserMm, nom)) {
      sansReference.push(nom);
      continue;
    }
    const ecartMm = Math.abs(valeurMm - laserMm[nom]);
    const conforme = ecartMm <= toleranceMm;
    lignes.push({ nom, origine, calculeMm: valeurMm, laserMm: laserMm[nom], ecartMm, conforme });
    ecartMaxMm = Math.max(ecartMaxMm, ecartMm);
    parOrigine[origine].nb += 1;
    if (!conforme) parOrigine[origine].nbHorsTolerance += 1;
  }
  return {
    conforme: lignes.length > 0 && sansReference.length === 0 && lignes.every((ligne) => ligne.conforme),
    ecartMaxMm,
    lignes,
    sansReference,
    parOrigine,
  };
}

/**
 * R12 : chaque état porte une icône et un texte explicite avec la tolérance.
 * @param {string} mode
 * @param {{resultatEssai?: {conforme?: boolean, provisoire?: boolean}}} [options]
 * @returns {PrecisionMode}
 */
export function etatPrecision(mode, { resultatEssai } = {}) {
  if (mode === MODES.COTES_SAISIES) {
    if (resultatEssai?.conforme === true && resultatEssai?.provisoire !== true) {
      return {
        mode,
        etat: "tolerance_tenue",
        icone: "info",
        titre: "Tolérance de ±2 cm tenue",
        libelle: "Cotes saisies : tolérance de ±2 cm tenue lors de l'essai sur la pièce de référence.",
      };
    }
    return {
      mode,
      etat: "qualification_en_attente",
      icone: "alerte",
      titre: "Qualification à ±2 cm en attente",
      libelle: "Cotes saisies : la précision de ±2 cm reste à qualifier avec la vraie pièce de référence et ses cotes au mètre laser.",
    };
  }
  if (mode === MODES.VIDEO || mode === MODES.WEBXR) {
    return {
      mode,
      etat: "non_garantie",
      icone: "alerte",
      titre: "Précision de ±2 cm non garantie",
      libelle: `Mode ${mode === MODES.VIDEO ? "vidéo" : "WebXR"} : précision de ±2 cm non garantie.`,
    };
  }
  throw new Error(`Mode de capture inconnu : ${mode}`);
}

/**
 * Évalue un jeu de référence en conservant son caractère provisoire pour la qualification du mode.
 * @param {{piece: Piece, laserMm: Record<string, number>, provisoire?: boolean}} reference
 * @param {number} [toleranceMm]
 * @returns {ResultatEssai}
 */
export function evaluerPieceReference(reference, toleranceMm = TOLERANCE_MM) {
  return {
    ...comparerAuReleveLaser(longueursAffichees(reference.piece), reference.laserMm, toleranceMm),
    provisoire: reference.provisoire === true,
  };
}
