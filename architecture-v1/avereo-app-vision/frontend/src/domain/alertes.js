// Messages des erreurs de métré. R12 : une information critique ne repose jamais sur la seule couleur :
// chaque alerte a une icône ET un libellé. Logique pure.

/** @typedef {"alerte"|"info"} NomIcone */

/**
 * @type {Record<string, {icone: NomIcone, titre: string, libelle: string}>}
 */
export const ALERTES = {
  POLYGONE_DEGENERE: {
    icone: "alerte",
    titre: "Contour incomplet",
    libelle: "La pièce n'a pas de surface : il faut au moins trois murs formant un contour fermé.",
  },
  POLYGONE_AUTO_SECANT: {
    icone: "alerte",
    titre: "Murs qui se croisent",
    libelle: "Le contour de la pièce se recoupe lui-même : les métrés ne sont pas calculés.",
  },
  OUVERTURE_HORS_MUR: {
    icone: "alerte",
    titre: "Ouverture hors du mur",
    libelle: "Une ouverture dépasse les extrémités de son mur.",
  },
  OUVERTURE_TROP_HAUTE: {
    icone: "alerte",
    titre: "Ouverture trop haute",
    libelle: "Une ouverture dépasse la hauteur sous plafond.",
  },
  OUVERTURE_CHEVAUCHEMENT: {
    icone: "alerte",
    titre: "Ouvertures qui se chevauchent",
    libelle: "Deux ouvertures se superposent sur le même mur.",
  },
  OUVERTURES_SUPERIEURES_MUR: {
    icone: "alerte",
    titre: "Ouvertures plus grandes que le mur",
    libelle: "Les ouvertures d'un mur dépassent sa surface : le métré net de ce mur est négatif.",
  },
};

const GENERIQUE = {
  icone: "alerte",
  titre: "Anomalie",
  libelle: "Une anomalie a été détectée dans la pièce.",
};

/**
 * @param {{code: string, message?: string, murIndex?: number, ouvertureId?: string}} erreur
 * @returns {{code: string, icone: NomIcone, titre: string, libelle: string, murIndex?: number, ouvertureId?: string}}
 */
export function decrireErreur(erreur) {
  const modele = ALERTES[erreur.code] ?? GENERIQUE;
  const complement = erreur.murIndex !== undefined ? ` (mur ${erreur.murIndex + 1})` : "";
  return {
    code: erreur.code,
    icone: modele.icone,
    titre: modele.titre,
    libelle: `${modele.libelle}${complement}`,
    murIndex: erreur.murIndex,
    ouvertureId: erreur.ouvertureId,
  };
}
