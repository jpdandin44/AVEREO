// Faux serveur de tests : applique le protocole de docs/synchronisation.md en mémoire (mêmes règles que lib/sync.php,
// qui est testé séparément contre la vraie base). Sert aux tests du moteur de synchronisation, sans réseau.
import { ErreurApi } from "../../src/services/api.js";

const meme = (a, b) => JSON.stringify(a) === JSON.stringify(b);

export function creerFauxServeur({ compte = "12" } = {}) {
  const projets = new Map(); // id -> {projet, objets: Map, seq, journal: []}
  let horloge = 0; // dates de modification successives des projets
  const etat = {
    horsLigne: false, // les appels échouent comme une coupure réseau
    session: true, // faux : 401
    perdreReponse: 0, // nombre de prochaines réponses perdues APRÈS application côté serveur
    refuser: null, // (changement, indice) => message|null : refus 422 de cet élément
    archives: new Set(),
    compteConnecte: compte, // compte de la session courante (peut changer pendant le test)
    identiteAttendue: "", // en-tête « identité attendue » du client, ex. « avereo_connect:12 »
    plafondObjets: Infinity, // au-delà : 413 project_too_large sans indice
    messageRefus: "Valeur refusée.",
    appels: [],
    avantReponse: null, // crochet asynchrone appelé entre l'application et la réponse (simule la durée d'un envoi)
    pendantEnvoi: null, // crochet asynchrone appelé dès l'arrivée de la requête, avant tout contrôle (simule une requête en vol)
  };

  function garde() {
    if (etat.horsLigne) throw new ErreurApi(0, "reseau", "Le serveur est injoignable.");
    if (!etat.session) throw new ErreurApi(401, "unauthorized", "Connexion requise.");
    if (etat.identiteAttendue && etat.identiteAttendue !== `avereo_connect:${etat.compteConnecte}`) {
      throw new ErreurApi(409, "identity_changed", "Un autre compte est connecté.");
    }
  }
  async function reponse(valeur) {
    if (etat.avantReponse) await etat.avantReponse();
    if (etat.perdreReponse > 0) {
      etat.perdreReponse -= 1;
      throw new ErreurApi(0, "reseau", "Réponse perdue.");
    }
    return valeur;
  }
  function projet(id) {
    const p = projets.get(id);
    if (!p) throw new ErreurApi(404, "not_found", "Projet introuvable.");
    return p;
  }
  function recevoir(p, since) {
    const tous = [...p.objets.values()].filter((o) => o.seq > since).sort((a, b) => a.seq - b.seq);
    const page = tous.slice(0, 500);
    return {
      changes: page.map((o) => ({ ...structuredClone(o), object_id: o.id, parent_id: o.parentId, data: o.deleted ? null : structuredClone(o.data) })),
      seq: tous.length > 500 ? page[page.length - 1].seq : p.seq,
      has_more: tous.length > 500,
    };
  }

  const api = {
    async identite() {
      garde();
      return { ok: true, identity: { provider: "avereo_connect", id: compte }, role: "conseiller", droits: [], auth_mode: "connect" };
    },
    async listerProjets() {
      garde();
      return [...projets.values()].map((p) => structuredClone(p.projet));
    },
    async creerProjet(donnees) {
      garde();
      etat.appels.push(["creerProjet", donnees.id]);
      const existant = projets.get(donnees.id);
      if (existant) {
        if (existant.projet.owner.id !== compte) throw new ErreurApi(409, "id_conflict", "Identifiant déjà utilisé.");
        return reponse(structuredClone(existant.projet));
      }
      const projetCree = { id: donnees.id, name: donnees.name, address: donnees.address ?? "", client_label: donnees.client_label ?? "", status: "active", owner: { provider: "avereo_connect", id: compte }, created_at: "2026-11-24T10:00:00Z", updated_at: "2026-11-24T10:00:00Z" };
      projets.set(donnees.id, { projet: projetCree, objets: new Map(), seq: 0, journal: [] });
      return reponse(structuredClone(projetCree));
    },
    async modifierProjet(id, champs) {
      garde();
      etat.appels.push(["modifierProjet", id]);
      const p = projet(id);
      Object.assign(p.projet, champs);
      if (champs.status === "archived") etat.archives.add(id);
      if (champs.status === "active") etat.archives.delete(id);
      return reponse(structuredClone(p.projet));
    },
    async synchroniser(projetId, { deviceId, since, changes }) {
      garde();
      etat.appels.push(["synchroniser", projetId, changes.length, since]);
      const p = projet(projetId);
      if (etat.pendantEnvoi) {
        const crochet = etat.pendantEnvoi;
        etat.pendantEnvoi = null;
        await crochet();
      }
      if (etat.archives.has(projetId)) throw new ErreurApi(409, "project_archived", "Projet archivé."); // comme le PHP : même pour un envoi vide
      const champs = {};
      changes.forEach((c, i) => {
        const message = etat.refuser?.(c, i);
        if (message) champs[`changes.${i}.data.nom`] = message;
      });
      if (Object.keys(champs).length > 0) throw new ErreurApi(422, "validation_failed", "Données invalides.", champs);
      const nouveaux = changes.filter((c) => !p.objets.has(c.object_id) && !c.deleted).length;
      if (p.objets.size + nouveaux > etat.plafondObjets && nouveaux > 0) throw new ErreurApi(413, "project_too_large", "Le projet contient trop d'objets.");
      const applied = [];
      for (const c of changes) {
        const existant = p.objets.get(c.object_id);
        if (!existant) {
          if (c.deleted) {
            applied.push({ object_id: c.object_id, rev: 0, seq: p.seq, status: "unchanged" });
            continue;
          }
          p.seq += 1;
          p.objets.set(c.object_id, { id: c.object_id, kind: c.kind, parentId: c.parent_id, data: structuredClone(c.data), rev: 1, seq: p.seq, deleted: false, device_id: deviceId, updated_by: compte });
          applied.push({ object_id: c.object_id, rev: 1, seq: p.seq, status: "applied" });
          continue;
        }
        const identique = existant.parentId === c.parent_id && existant.deleted === c.deleted && (c.deleted || meme(existant.data, c.data));
        if (identique) {
          applied.push({ object_id: c.object_id, rev: existant.rev, seq: existant.seq, status: "unchanged" });
          continue;
        }
        p.seq += 1;
        const conflit = c.base_rev !== existant.rev && existant.device_id !== deviceId;
        if (conflit) {
          p.journal.push({
            id: p.journal.length + 1, seq: p.seq, object_id: c.object_id, kind: c.kind, created_at: "2026-11-24T12:00:00.000Z",
            lost: { rev: existant.rev, data: structuredClone(existant.data), deleted: existant.deleted, device_id: existant.device_id, by: existant.updated_by },
            won: { rev: existant.rev + 1, device_id: deviceId, by: compte },
          });
        }
        Object.assign(existant, { parentId: c.parent_id, deleted: c.deleted, rev: existant.rev + 1, seq: p.seq, device_id: deviceId, updated_by: compte });
        if (!c.deleted) existant.data = structuredClone(c.data);
        applied.push({ object_id: c.object_id, rev: existant.rev, seq: p.seq, status: conflit ? "conflict" : "applied" });
      }
      if (applied.some((a) => a.status !== "unchanged")) {
        horloge += 1;
        p.projet.updated_at = `2026-11-25T10:00:${String(horloge).padStart(2, "0")}.000Z`;
      }
      return reponse({ ok: true, applied, ...recevoir(p, since) });
    },
    async recevoir(projetId, since) {
      garde();
      return { ok: true, ...recevoir(projet(projetId), since) };
    },
    async journal(projetId, apres = 0) {
      garde();
      return structuredClone(projet(projetId).journal.filter((e) => e.id > apres));
    },
  };
  return { api, etat, projets };
}
