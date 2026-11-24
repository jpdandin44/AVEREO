// Journal des valeurs écrasées ; le format de date est fourni par l'appelant.

/**
 * @typedef {{id: number, seq: number, object_id: string, kind: import("./objets.js").Kind, created_at: string,
 *   lost: {rev: number, data: import("./objets.js").Donnees|null, deleted: boolean, device_id: string, by: string},
 *   won: {rev: number, device_id: string, by: string}}} EntreeJournal
 */

/** @param {EntreeJournal[]} entrees @param {string} deviceId @returns {EntreeJournal[]} */
export function ecrasementsSubis(entrees, deviceId) {
  return entrees.filter((entree) => entree.lost.device_id === deviceId).sort((a, b) => a.id - b.id);
}

/** @param {EntreeJournal} entree @param {(isoString: string) => string} formaterDate @returns {string} */
export function libelleEcrasement(entree, formaterDate) {
  const types = { batiment: "du bâtiment", niveau: "du niveau", piece: "de la pièce", ouverture: "de l'ouverture" };
  const nom = entree.lost.data?.nom ?? entree.object_id;
  const debut = entree.lost.deleted ? "La suppression" : "Votre modification";
  return `${debut} ${types[entree.kind]} « ${nom} » a été remplacée par une modification plus récente le ${formaterDate(entree.created_at)}.`;
}
