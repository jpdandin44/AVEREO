// Représentation des objets synchronisés : uniquement les champs du contrat.

/**
 * @typedef {"batiment"|"niveau"|"piece"|"ouverture"|"photo"|"commentaire"} Kind
 * @typedef {{nom: string}} DonneesBatiment
 * @typedef {{nom: string, ordre: number}} DonneesNiveau
 * @typedef {{nom: string, hauteurMm: number, ordre: number, sommets: {x: number, y: number}[], cotesLaser?:import('../domain/modele.js').CotesLaser}} DonneesPiece
 * @typedef {{type: "porte"|"fenetre", murIndex: number, positionMm: number,
 *   largeurMm: number, hauteurMm: number, alleMm: number}} DonneesOuverture
 * @typedef {Omit<import('../domain/modele.js').Photo,'id'>} DonneesPhoto
 * @typedef {Omit<import('../domain/modele.js').Commentaire,'id'>} DonneesCommentaire
 * @typedef {DonneesBatiment|DonneesNiveau|DonneesPiece|DonneesOuverture|DonneesPhoto|DonneesCommentaire} Donnees
 * @typedef {{id: string, kind: Kind, parentId: string|null, data: Donnees}} ObjetAplati
 * @typedef {{id: string, kind: Kind, parentId: string|null, data: Donnees|null, rev: number, deleted: boolean}} ObjetLocal
 * @typedef {{objectId: string, kind: Kind, parentId: string|null, data: Donnees|null, deleted: boolean}} Changement
 * @typedef {Changement & {baseRev: number, version: number}} EntreeFile
 * @typedef {{object_id: string, kind: Kind, parent_id: string|null, data: Donnees|null,
 *   deleted: boolean, rev: number, seq: number, updated_by: string, device_id: string}} ObjetRecu
 */

/**
 * Les parents précèdent leurs enfants ; les sommets sont copiés sans métadonnées du domaine.
 * @param {import("../domain/modele.js").Batiment} batiment
 * @returns {ObjetAplati[]}
 */
export function aplatirBatiment(batiment) {
  const objets = [{ id: batiment.id, kind: "batiment", parentId: null, data: { nom: batiment.nom } }];
  batiment.niveaux.forEach((niveau, ordre) => {
    objets.push({ id: niveau.id, kind: "niveau", parentId: batiment.id, data: { nom: niveau.nom, ordre } });
    for (const kind of ["photo", "commentaire"]) {
      for (const item of niveau[kind === "photo" ? "photos" : "commentaires"] ?? []) {
        const { id, ...data } = item;
        objets.push({ id, kind, parentId: niveau.id, data: structuredClone(data) });
      }
    }
    niveau.pieces.forEach((piece, ordrePiece) => {
      objets.push({
        id: piece.id, kind: "piece", parentId: niveau.id,
        data: {
          ...(piece.cotesLaser ? { cotesLaser: structuredClone(piece.cotesLaser) } : {}),
          nom: piece.nom, hauteurMm: piece.hauteurMm, ordre: ordrePiece,
          sommets: piece.sommets.map(({ x, y }) => ({ x, y })),
        },
      });
      for (const ouverture of piece.ouvertures) {
        const { id, type, murIndex, positionMm, largeurMm, hauteurMm, alleMm } = ouverture;
        objets.push({
          id, kind: "ouverture", parentId: piece.id,
          data: { type, murIndex, positionMm, largeurMm, hauteurMm, alleMm },
        });
      }
    });
  });
  return objets;
}

/** Égalité des valeurs JSON, sans tenir compte de l'ordre des clés. @param {any} a @param {any} b @returns {boolean} */
function egaux(a, b) {
  if (a === b) return true;
  if (a === null || b === null || typeof a !== "object" || typeof b !== "object") return false;
  if (Array.isArray(a) || Array.isArray(b)) {
    return Array.isArray(a) && Array.isArray(b) && a.length === b.length && a.every((valeur, i) => egaux(valeur, b[i]));
  }
  const cles = Object.keys(a);
  return cles.length === Object.keys(b).length && cles.every((cle) => Object.hasOwn(b, cle) && egaux(a[cle], b[cle]));
}

/**
 * @param {{parentId: string|null, deleted: boolean, data: Donnees|null}} a
 * @param {{parentId: string|null, deleted: boolean, data: Donnees|null}} b
 * @returns {boolean}
 */
export function memeContenu(a, b) {
  return a.parentId === b.parentId && a.deleted === b.deleted && egaux(a.data, b.data);
}
