// Stockage local en mémoire : mêmes méthodes asynchrones que le stockage Dexie (voir stockage-dexie.js). Sert aux tests du
// moteur de synchronisation et de repli si IndexedDB est indisponible (navigation privée de certains navigateurs).
// Tout ce qui entre et sort est copié : un appelant ne peut jamais modifier l'état stocké sans passer par une méthode.

const copie = (valeur) => (valeur === undefined ? undefined : structuredClone(valeur));

/**
 * @typedef {import("./stockage-dexie.js").Stockage} Stockage
 * @returns {Stockage}
 */
export function creerStockageMemoire() {
  const meta = new Map();
  const medias = new Map();
  const projets = new Map();
  let operations = [];
  /** @type {Map<string, {objets: Map<string, any>, file: any[], seq: number}>} */
  const contenus = new Map();
  /** @type {Map<string, Map<number, any>>} */
  const journaux = new Map();

  const contenu = (projetId) => {
    if (!contenus.has(projetId)) contenus.set(projetId, { objets: new Map(), file: [], seq: 0 });
    return contenus.get(projetId);
  };

  return {
    async sauverMedia(media) { medias.set(`${media.projectId}:${media.id}`, copie(media)); },
    async lireMedia(projectId, id) { return copie(medias.get(`${projectId}:${id}`)); },
    async listerMedias(projectId) { return [...medias.values()].filter(m => m.projectId === projectId).map(copie); },
    async retirerMedia(projectId, id) { medias.delete(`${projectId}:${id}`); },
    async lireMeta(cle) {
      return copie(meta.get(cle));
    },
    async ecrireMeta(cle, valeur) {
      meta.set(cle, copie(valeur));
    },
    async listerProjets() {
      return [...projets.values()].map(copie);
    },
    async lireProjet(id) {
      return copie(projets.get(id));
    },
    async sauverProjets(liste) {
      for (const projet of liste) projets.set(projet.id, copie(projet));
    },
    async retirerProjets(ids) {
      for (const id of ids) projets.delete(id);
    },
    async lireOperations() {
      return copie(operations);
    },
    async ecrireOperations(liste) {
      operations = copie(liste);
    },
    async chargerProjet(projetId) {
      const c = contenu(projetId);
      return { objets: [...c.objets.values()].map(copie), file: copie(c.file), seq: c.seq };
    },
    async sauverProjet(projetId, { objets, file, seq } = {}) {
      const c = contenu(projetId);
      for (const objet of objets ?? []) c.objets.set(objet.id, copie(objet));
      if (file !== undefined) c.file = copie(file);
      if (seq !== undefined) c.seq = seq;
    },
    async listerProjetsEnAttente() {
      return [...contenus.entries()].filter(([, c]) => c.file.length > 0).map(([id]) => id);
    },
    async lireJournal(projetId) {
      return [...(journaux.get(projetId)?.values() ?? [])].sort((a, b) => a.id - b.id).map(copie);
    },
    async ajouterJournal(projetId, entrees) {
      if (!journaux.has(projetId)) journaux.set(projetId, new Map());
      for (const entree of entrees) journaux.get(projetId).set(entree.id, copie(entree));
    },
  };
}
