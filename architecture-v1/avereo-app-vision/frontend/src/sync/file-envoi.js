// File immuable : dernière valeur locale, première révision connue du serveur.

/** @returns {import("./objets.js").EntreeFile[]} */
export function fileVide() {
  return [];
}

/**
 * @param {import("./objets.js").EntreeFile[]} file
 * @param {import("./objets.js").Changement[]} changements
 * @param {(objectId: string) => number} revConnue
 * @param {() => number} [prochaineVersion] numéro de version d'une nouvelle entrée ; en production, un numéro qui ne se
 *   répète jamais (même après l'acquittement d'une entrée), pour qu'une réponse tardive ne retire pas une modification plus récente.
 * @returns {import("./objets.js").EntreeFile[]}
 */
export function empiler(file, changements, revConnue, prochaineVersion = () => 1) {
  const resultat = file.slice();
  for (const changement of changements) {
    const index = resultat.findIndex((entree) => entree.objectId === changement.objectId);
    if (index === -1) {
      resultat.push({ ...changement, baseRev: revConnue(changement.objectId), version: prochaineVersion() });
    } else {
      const precedente = resultat[index];
      // Création puis suppression : elles s'annulent seulement si la création n'est JAMAIS partie. Une entrée déjà envoyée
      // (réponse perdue ou en vol) a peut-être été reçue : la suppression doit alors partir aussi.
      if (precedente.baseRev === 0 && !precedente.envoye && changement.deleted) resultat.splice(index, 1);
      else resultat[index] = { ...changement, baseRev: precedente.baseRev, version: Math.max(prochaineVersion(), precedente.version + 1), ...(precedente.envoye ? { envoye: true } : {}) };
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

/**
 * Marque comme « envoyées » les entrées d'un lot, AVANT l'appel réseau : si la réponse se perd, on sait que le serveur a
 * peut-être reçu la création.
 * @param {import("./objets.js").EntreeFile[]} file @param {import("./objets.js").EntreeFile[]} lot @returns {import("./objets.js").EntreeFile[]}
 */
export function marquerEnvoyees(file, lot) {
  const versions = new Map(lot.map((entree) => [entree.objectId, entree.version]));
  return file.map((entree) => (versions.get(entree.objectId) === entree.version ? { ...entree, envoye: true } : entree));
}

/**
 * Retire de la file les entrées refusées, mais seulement dans la version qui a été envoyée : si l'utilisateur a corrigé l'objet
 * pendant l'envoi, sa version corrigée reste dans la file.
 * @param {import("./objets.js").EntreeFile[]} file @param {import("./objets.js").EntreeFile[]} refusees @returns {import("./objets.js").EntreeFile[]}
 */
export function retirerVersions(file, refusees) {
  const versions = new Map(refusees.map((entree) => [entree.objectId, entree.version]));
  return file.filter((entree) => versions.get(entree.objectId) !== entree.version);
}

/** @param {import("./objets.js").EntreeFile[]} file @param {string[]} objectIds @returns {import("./objets.js").EntreeFile[]} */
export function retirer(file, objectIds) {
  const ids = new Set(objectIds);
  return file.filter((entree) => !ids.has(entree.objectId));
}
