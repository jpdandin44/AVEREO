// Reconstruction du domaine ; une incohérence n'entraîne aucune suppression locale.
import { validerOuverture } from "../domain/modele.js";

/** @param {{id: string}} a @param {{id: string}} b @returns {number} */
function comparerId(a, b) {
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

/**
 * @param {import("./objets.js").ObjetLocal[]} objets
 * @param {string} [idBatimentPrefere]
 * @returns {{batiment: import("../domain/modele.js").Batiment|null,
 *   avertissements: {type: "ouverture-incoherente", ouvertureId: string, pieceId: string, message: string}[], orphelins: string[]}}
 */
export function assemblerBatiment(objets, idBatimentPrefere = "batiment-1") {
  const actifs = objets.filter((objet) => !objet.deleted);
  const parId = new Map(actifs.map((objet) => [objet.id, objet]));
  const parents = { photo: "niveau", commentaire: "niveau", ouverture: "piece", piece: "niveau", niveau: "batiment" };
  const orphelins = actifs.filter((objet) => {
    let courant = objet;
    while (courant.kind !== "batiment") {
      const parent = parId.get(courant.parentId);
      if (!parent || parent.kind !== parents[courant.kind]) return true;
      courant = parent;
    }
    return false;
  }).map((objet) => objet.id).sort();
  const avertissements = [];
  const batiments = actifs.filter((objet) => objet.kind === "batiment").sort(comparerId);
  const racine = batiments.find((objet) => objet.id === idBatimentPrefere) ?? batiments[0];
  if (!racine) return { batiment: null, avertissements, orphelins };

  const enfants = (parentId, kind) => actifs
    .filter((objet) => objet.parentId === parentId && objet.kind === kind)
    .sort((a, b) => (["niveau", "piece"].includes(kind) ? a.data.ordre - b.data.ordre : 0) || comparerId(a, b));
  const niveaux = enfants(racine.id, "niveau").map((niveau) => ({
    id: niveau.id, nom: niveau.data.nom,
    ...(enfants(niveau.id, "photo").length ? { photos: enfants(niveau.id, "photo").map(o => ({ id: o.id, ...o.data })) } : {}),
    ...(enfants(niveau.id, "commentaire").length ? { commentaires: enfants(niveau.id, "commentaire").map(o => ({ id: o.id, ...o.data })) } : {}),
    pieces: enfants(niveau.id, "piece").map((objetPiece) => {
      const piece = {
        ...(objetPiece.data.cotesLaser ? { cotesLaser: structuredClone(objetPiece.data.cotesLaser) } : {}),
        id: objetPiece.id, nom: objetPiece.data.nom, hauteurMm: objetPiece.data.hauteurMm,
        sommets: objetPiece.data.sommets.map(({ x, y }) => ({ x, y })),
        ouvertures: enfants(objetPiece.id, "ouverture").map((ouverture) => ({ id: ouverture.id, ...ouverture.data })),
      };
      for (const ouverture of piece.ouvertures) {
        const message = validerOuverture(piece, ouverture);
        if (message) avertissements.push({ type: "ouverture-incoherente", ouvertureId: ouverture.id, pieceId: piece.id, message });
      }
      return piece;
    }),
  }));
  return { batiment: { id: racine.id, nom: racine.data.nom, niveaux }, avertissements, orphelins };
}
