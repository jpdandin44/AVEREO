// Métrés en unités SI, sans arrondi ni modification du relevé. Logique pure.

import { aireMm2, perimetreMm, longueurMurMm, estAutoSecant } from "./geometrie.js";
import { ALERTES } from "./alertes.js";

/**
 * @typedef {import("./modele.js").Piece} Piece
 * @typedef {import("./modele.js").Niveau} Niveau
 * @typedef {{code: string, message: string, murIndex?: number, ouvertureId?: string}} ErreurMetres
 * @typedef {{index: number, longueurM: number, brutM2: number, ouverturesM2: number, netM2: number}} MetresMur
 * @typedef {{
 *   valide: boolean,
 *   solM2: number|null, perimetreM: number|null, hauteurM: number|null,
 *   plafondM2: number|null, mursBrutsM2: number|null, volumeM3: number|null,
 *   ouverturesM2: number|null, mursNetsM2: number|null, plinthesM: number|null,
 *   murs: MetresMur[], erreurs: ErreurMetres[]
 * }} Metres
 */

const CHAMPS_NUMERIQUES = /** @type {const} */ ([
  "solM2", "perimetreM", "hauteurM", "plafondM2", "mursBrutsM2",
  "volumeM3", "ouverturesM2", "mursNetsM2", "plinthesM",
]);

/** @returns {Metres} */
function metresVides() {
  return {
    valide: true,
    solM2: 0, perimetreM: 0, hauteurM: 0, plafondM2: 0, mursBrutsM2: 0,
    volumeM3: 0, ouverturesM2: 0, mursNetsM2: 0, plinthesM: 0,
    murs: [], erreurs: [],
  };
}

/**
 * Un contour invalide annule tous les métrés. Les anomalies d'ouverture restent
 * des alertes : leurs dimensions sont déduites telles quelles, sans écrêtage.
 * @param {Piece} piece
 * @returns {Metres}
 */
export function calculerMetres(piece) {
  const metres = metresVides();
  const surfaceMm2 = aireMm2(piece.sommets);
  const longueursMm = piece.sommets.map((_, index) => longueurMurMm(piece.sommets, index));
  const sommetEnDouble = piece.sommets.length >= 3 && longueursMm.some((longueur) => longueur === 0);
  if (piece.sommets.length < 3 || surfaceMm2 === 0) {
    metres.erreurs.push({ code: "POLYGONE_DEGENERE", message: ALERTES.POLYGONE_DEGENERE.libelle, pieceId: piece.id });
  }
  if (sommetEnDouble) {
    metres.erreurs.push({ code: "SOMMET_EN_DOUBLE", message: ALERTES.SOMMET_EN_DOUBLE.libelle, pieceId: piece.id });
  } else if (estAutoSecant(piece.sommets)) {
    metres.erreurs.push({ code: "POLYGONE_AUTO_SECANT", message: ALERTES.POLYGONE_AUTO_SECANT.libelle, pieceId: piece.id });
  }
  if (!Number.isFinite(piece.hauteurMm) || piece.hauteurMm <= 0) {
    metres.erreurs.push({ code: "HAUTEUR_INVALIDE", message: ALERTES.HAUTEUR_INVALIDE.libelle, pieceId: piece.id });
  }
  if (metres.erreurs.length > 0) {
    metres.valide = false;
    for (const champ of CHAMPS_NUMERIQUES) metres[champ] = null;
    return metres;
  }

  const ouverturesParMurMm2 = Array(longueursMm.length).fill(0);
  let ouverturesMm2 = 0;
  let portesMm = 0;

  for (const [index, ouverture] of piece.ouvertures.entries()) {
    const { murIndex, positionMm, largeurMm, hauteurMm, alleMm } = ouverture;
    const contexte = { murIndex, ouvertureId: ouverture.id, pieceId: piece.id };
    const dimensionsValides =
      [positionMm, largeurMm, hauteurMm, alleMm].every(Number.isFinite) && largeurMm > 0 && hauteurMm > 0 && alleMm >= 0;
    if (!dimensionsValides) {
      // Une ouverture aux dimensions absentes ou négatives n'est pas comptée : elle gonflerait les murs nets.
      metres.erreurs.push({ code: "OUVERTURE_DIMENSION_INVALIDE", message: ALERTES.OUVERTURE_DIMENSION_INVALIDE.libelle, ...contexte });
      continue;
    }
    const surfaceOuvertureMm2 = largeurMm * hauteurMm;
    ouverturesMm2 += surfaceOuvertureMm2;
    if (ouverture.type === "porte") portesMm += largeurMm;

    const murExiste = Number.isInteger(murIndex) && murIndex >= 0 && murIndex < longueursMm.length;
    if (murExiste) ouverturesParMurMm2[murIndex] += surfaceOuvertureMm2;
    if (!murExiste || positionMm < 0 || positionMm + largeurMm > longueursMm[murIndex]) {
      metres.erreurs.push({ code: "OUVERTURE_HORS_MUR", message: ALERTES.OUVERTURE_HORS_MUR.libelle, ...contexte });
    }
    if (alleMm + hauteurMm > piece.hauteurMm) {
      metres.erreurs.push({ code: "OUVERTURE_TROP_HAUTE", message: ALERTES.OUVERTURE_TROP_HAUTE.libelle, ...contexte });
    }
    for (let precedent = 0; murExiste && precedent < index; precedent += 1) {
      const autre = piece.ouvertures[precedent];
      if (
        autre.murIndex === murIndex &&
        [autre.positionMm, autre.largeurMm].every(Number.isFinite) &&
        autre.largeurMm > 0 &&
        Math.max(positionMm, autre.positionMm) < Math.min(positionMm + largeurMm, autre.positionMm + autre.largeurMm)
      ) {
        metres.erreurs.push({ code: "OUVERTURE_CHEVAUCHEMENT", message: ALERTES.OUVERTURE_CHEVAUCHEMENT.libelle, ...contexte });
      }
    }
  }

  metres.solM2 = surfaceMm2 / 1_000_000;
  metres.plafondM2 = metres.solM2;
  metres.perimetreM = perimetreMm(piece.sommets) / 1000;
  metres.hauteurM = piece.hauteurMm / 1000;
  metres.mursBrutsM2 = metres.perimetreM * metres.hauteurM;
  metres.volumeM3 = metres.solM2 * metres.hauteurM;
  metres.ouverturesM2 = ouverturesMm2 / 1_000_000;
  metres.mursNetsM2 = metres.mursBrutsM2 - metres.ouverturesM2;
  metres.plinthesM = metres.perimetreM - portesMm / 1000;
  metres.murs = longueursMm.map((longueurMm, index) => {
    const brutMm2 = longueurMm * piece.hauteurMm;
    if (ouverturesParMurMm2[index] > brutMm2) {
      metres.erreurs.push({
        code: "OUVERTURES_SUPERIEURES_MUR",
        message: ALERTES.OUVERTURES_SUPERIEURES_MUR.libelle,
        murIndex: index,
        pieceId: piece.id,
      });
    }
    const brutM2 = brutMm2 / 1_000_000;
    const ouverturesM2 = ouverturesParMurMm2[index] / 1_000_000;
    return { index, pieceId: piece.id, longueurM: longueurMm / 1000, brutM2, ouverturesM2, netM2: brutM2 - ouverturesM2 };
  });
  return metres;
}

/**
 * Somme les champs numériques et concatène murs et erreurs (chaque mur et chaque erreur porte l'id de sa pièce).
 * La hauteur n'a pas de sens pour un niveau (somme de hauteurs) : hauteurM vaut toujours null.
 * Si une pièce est invalide, le niveau est invalide et tous ses totaux sont null.
 * Un niveau vide est valide avec des totaux nuls (0).
 * @param {Niveau} niveau
 * @returns {Metres}
 */
export function calculerMetresNiveau(niveau) {
  const total = metresVides();
  for (const piece of niveau.pieces) {
    const metres = calculerMetres(piece);
    total.erreurs.push(...metres.erreurs);
    total.murs.push(...metres.murs);
    total.valide = total.valide && metres.valide;
    for (const champ of CHAMPS_NUMERIQUES) {
      if (champ === "hauteurM") continue;
      const valeur = metres[champ];
      const cumul = total[champ];
      total[champ] = cumul === null || valeur === null ? null : cumul + valeur;
    }
  }
  total.hauteurM = null;
  return total;
}
