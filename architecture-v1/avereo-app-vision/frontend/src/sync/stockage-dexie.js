// Stockage local Dexie (IndexedDB) : une base par identité (compte CONNECT), donc cloisonnée (R08, docs/synchronisation.md §6).
// Aucune donnée n'est chiffrée : la protection est le verrouillage de l'appareil (limite documentée).
import Dexie from "dexie";

/**
 * Contrat commun des stockages (Dexie et mémoire). Tout est asynchrone.
 * @typedef {{id: string, kind: string, parentId: string|null, data: object|null, rev: number, deleted: boolean}} ObjetLocal
 * @typedef {{objectId: string, kind: string, parentId: string|null, data: object|null, deleted: boolean, baseRev: number, version: number}} EntreeFile
 * @typedef {{id: string, name: string, address: string, client_label: string, status: string, created_at?: string, updated_at?: string, owner?: object}} ProjetLocal
 * @typedef {{
 *   lireMeta(cle: string): Promise<any>,
 *   ecrireMeta(cle: string, valeur: any): Promise<void>,
 *   listerProjets(): Promise<ProjetLocal[]>,
 *   lireProjet(id: string): Promise<ProjetLocal|undefined>,
 *   sauverProjets(projets: ProjetLocal[]): Promise<void>,
 *   retirerProjets(ids: string[]): Promise<void>,
 *   lireOperations(): Promise<any[]>,
 *   ecrireOperations(operations: any[]): Promise<void>,
 *   chargerProjet(projetId: string): Promise<{objets: ObjetLocal[], file: EntreeFile[], seq: number}>,
 *   sauverProjet(projetId: string, contenu: {objets?: ObjetLocal[], file?: EntreeFile[], seq?: number}): Promise<void>,
 *   listerProjetsEnAttente(): Promise<string[]>,
 *   lireJournal(projetId: string): Promise<any[]>,
 *   ajouterJournal(projetId: string, entrees: any[]): Promise<void>
 * }} Stockage
 */

/** Nom de la base d'une identité. @param {{provider: string, id: string}} identite */
export function nomBase(identite) {
  return `avereo-vision:${identite.provider}:${identite.id}`;
}

/**
 * @param {{nom: string, indexedDB?: IDBFactory, IDBKeyRange?: typeof IDBKeyRange}} options  (indexedDB et IDBKeyRange sont injectés par les tests)
 * @returns {Stockage & {fermer(): void, supprimer(): Promise<void>}}
 */
export function creerStockageDexie({ nom, indexedDB, IDBKeyRange }) {
  const base = new Dexie(nom, indexedDB ? { indexedDB, IDBKeyRange } : undefined);
  base.version(1).stores({
    meta: "cle",
    projets: "id",
    operations: "cle",
    objets: "[projectId+id], projectId",
    files: "projectId",
    suivis: "projectId",
    journal: "[projectId+id], projectId",
  });

  return {
    async lireMeta(cle) {
      return (await base.table("meta").get(cle))?.valeur;
    },
    async ecrireMeta(cle, valeur) {
      await base.table("meta").put({ cle, valeur });
    },
    async listerProjets() {
      return base.table("projets").toArray();
    },
    async lireProjet(id) {
      return base.table("projets").get(id);
    },
    async sauverProjets(liste) {
      await base.table("projets").bulkPut(liste);
    },
    async retirerProjets(ids) {
      await base.table("projets").bulkDelete(ids);
    },
    async lireOperations() {
      return (await base.table("operations").get("operations"))?.liste ?? [];
    },
    async ecrireOperations(liste) {
      await base.table("operations").put({ cle: "operations", liste });
    },
    async chargerProjet(projetId) {
      const [lignes, file, suivi] = await Promise.all([
        base.table("objets").where("projectId").equals(projetId).toArray(),
        base.table("files").get(projetId),
        base.table("suivis").get(projetId),
      ]);
      return { objets: lignes.map(({ projectId, ...objet }) => objet), file: file?.entrees ?? [], seq: suivi?.seq ?? 0 };
    },
    async sauverProjet(projetId, { objets, file, seq } = {}) {
      // Une seule transaction : objets, file d'envoi et curseur s'écrivent ensemble ou pas du tout (R03).
      await base.transaction("rw", base.table("objets"), base.table("files"), base.table("suivis"), async () => {
        if (objets?.length) await base.table("objets").bulkPut(objets.map((objet) => ({ ...objet, projectId: projetId })));
        if (file !== undefined) await base.table("files").put({ projectId: projetId, entrees: file });
        if (seq !== undefined) await base.table("suivis").put({ projectId: projetId, seq });
      });
    },
    async listerProjetsEnAttente() {
      return (await base.table("files").toArray()).filter((f) => f.entrees.length > 0).map((f) => f.projectId);
    },
    async lireJournal(projetId) {
      const lignes = await base.table("journal").where("projectId").equals(projetId).toArray();
      return lignes.map(({ projectId, ...entree }) => entree).sort((a, b) => a.id - b.id);
    },
    async ajouterJournal(projetId, entrees) {
      await base.table("journal").bulkPut(entrees.map((entree) => ({ ...entree, projectId: projetId })));
    },
    fermer() {
      base.close();
    },
    async supprimer() {
      await base.delete();
    },
  };
}
