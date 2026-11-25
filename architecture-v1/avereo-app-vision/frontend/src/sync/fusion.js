// Réception : la valeur locale en attente reste prioritaire jusqu'à son envoi.

/**
 * @param {Map<string, import("./objets.js").ObjetLocal>} objets
 * @param {import("./objets.js").EntreeFile[]} file
 * @param {import("./objets.js").ObjetRecu[]} recus
 * @returns {{objets: Map<string, import("./objets.js").ObjetLocal>, enAttente: string[]}}
 */
export function appliquerReception(objets, file, recus) {
  const resultat = new Map(objets);
  const idsEnFile = new Set(file.map((entree) => entree.objectId));
  const enAttente = new Set();
  for (const recu of recus) {
    const local = resultat.get(recu.object_id);
    if (local && local.rev >= recu.rev) continue;
    if (local && idsEnFile.has(recu.object_id)) {
      resultat.set(local.id, { ...local, rev: Math.max(local.rev, recu.rev) });
      enAttente.add(local.id);
    } else {
      resultat.set(recu.object_id, {
        id: recu.object_id, kind: recu.kind, parentId: recu.parent_id,
        data: recu.data, rev: recu.rev, deleted: recu.deleted,
      });
    }
  }
  return { objets: resultat, enAttente: [...enAttente] };
}
