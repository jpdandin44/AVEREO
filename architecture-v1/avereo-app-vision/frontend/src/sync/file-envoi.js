// File immuable : dernière valeur locale, première révision connue du serveur.

/** @returns {import("./objets.js").EntreeFile[]} */
export function fileVide() {
  return [];
}

/**
 * @param {import("./objets.js").EntreeFile[]} file
 * @param {import("./objets.js").Changement[]} changements
 * @param {(objectId: string) => number} revConnue
 * @returns {import("./objets.js").EntreeFile[]}
 */
export function empiler(file, changements, revConnue) {
  const resultat = file.slice();
  for (const changement of changements) {
    const index = resultat.findIndex((entree) => entree.objectId === changement.objectId);
    if (index === -1) {
      resultat.push({ ...changement, baseRev: revConnue(changement.objectId), version: 1 });
    } else {
      const precedente = resultat[index];
      if (precedente.baseRev === 0 && changement.deleted) resultat.splice(index, 1);
      else resultat[index] = { ...changement, baseRev: precedente.baseRev, version: precedente.version + 1 };
    }
  }
  return resultat;
}

/** @param {import("./objets.js").EntreeFile[]} file @param {number} [max] @returns {import("./objets.js").EntreeFile[]} */
export function prendreLot(file, max = 100) {
  return file.slice(0, max);
}

/**
 * @param {import("./objets.js").EntreeFile[]} file
 * @param {import("./objets.js").EntreeFile[]} envoyes
 * @param {{object_id: string, rev: number}[]} appliques
 * @returns {import("./objets.js").EntreeFile[]}
 */
export function acquitter(file, envoyes, appliques) {
  const versionsEnvoyees = new Map(envoyes.map((entree) => [entree.objectId, entree.version]));
  const revisions = new Map(appliques.map((objet) => [objet.object_id, objet.rev]));
  return file.flatMap((entree) => {
    if (!versionsEnvoyees.has(entree.objectId) || !revisions.has(entree.objectId)) return [entree];
    const versionEnvoyee = versionsEnvoyees.get(entree.objectId);
    if (entree.version === versionEnvoyee) return [];
    return [entree.version > versionEnvoyee ? { ...entree, baseRev: revisions.get(entree.objectId) } : entree];
  });
}

/** @param {import("./objets.js").EntreeFile[]} file @param {string[]} objectIds @returns {import("./objets.js").EntreeFile[]} */
export function retirer(file, objectIds) {
  const ids = new Set(objectIds);
  return file.filter((entree) => !ids.has(entree.objectId));
}
