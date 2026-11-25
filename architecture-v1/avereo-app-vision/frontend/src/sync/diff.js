// Diff entre deux états validés du domaine, sans modifier ces états.
import { aplatirBatiment, memeContenu } from "./objets.js";

/**
 * @param {import("../domain/modele.js").Batiment|null} avant
 * @param {import("../domain/modele.js").Batiment} apres
 * @returns {import("./objets.js").Changement[]}
 */
export function diffBatiment(avant, apres) {
  const anciens = avant === null ? [] : aplatirBatiment(avant);
  const nouveaux = aplatirBatiment(apres);
  const avantParId = new Map(anciens.map((objet) => [objet.id, objet]));
  const apresParId = new Map(nouveaux.map((objet) => [objet.id, objet]));
  const changements = [];
  for (const objet of nouveaux) {
    const precedent = avantParId.get(objet.id);
    if (!precedent || !memeContenu({ ...precedent, deleted: false }, { ...objet, deleted: false })) {
      changements.push({ objectId: objet.id, kind: objet.kind, parentId: objet.parentId, data: objet.data, deleted: false });
    }
  }
  // Le parcours inverse place toutes les suppressions d'enfants avant celle de leur parent.
  for (const objet of anciens.slice().reverse()) {
    if (!apresParId.has(objet.id)) {
      changements.push({ objectId: objet.id, kind: objet.kind, parentId: objet.parentId, data: null, deleted: true });
    }
  }
  return changements;
}
