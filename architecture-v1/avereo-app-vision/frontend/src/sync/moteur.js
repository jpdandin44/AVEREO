// Moteur de synchronisation (R03, R04, R05, R06) : enregistrement local immédiat, file d'envoi, envoi et réception.
// Contrat : docs/synchronisation.md. Le moteur ne connaît ni React ni le DOM : le stockage, l'API et l'horloge sont injectés,
// ce qui permet de le tester sans navigateur. Les déclencheurs (minuterie de 30 s, retour du réseau, retour d'onglet) sont dans useSynchro.js.
import { creerBatiment, creerNiveau } from "../domain/modele.js";
import { ErreurApi, estCoupure } from "../services/api.js";
import { assemblerBatiment } from "./assembler.js";
import { diffBatiment } from "./diff.js";
import { acquitter, empiler, prendreLot, retirer } from "./file-envoi.js";
import { appliquerReception } from "./fusion.js";
import { annoterProjets, appliquerOperations, ecartsDescriptifs, empilerOperation, genererIdProjet, retirerOperation } from "./operations-projets.js";

export const ID_BATIMENT = "batiment-1";
export const ID_NIVEAU = "niveau-1";
const LOT_MAX = 100;
const TOURS_MAX = 20;
const PROJETS_EN_CACHE = 200;

/** Bâtiment d'un projet neuf. Identifiants fixes : deux appareils qui ouvrent le même projet vide créent les mêmes objets. */
export function batimentParDefaut() {
  return creerBatiment({ id: ID_BATIMENT, nom: "Logement", niveaux: [creerNiveau({ id: ID_NIVEAU, nom: "Rez-de-chaussée" })] });
}

/** Identifiant de cet appareil, tiré une fois et gardé dans la base locale du compte. */
export async function obtenirDeviceId(stockage, generer = () => genererIdProjet()) {
  const connu = await stockage.lireMeta("device_id");
  if (connu) return connu;
  const nouveau = generer();
  await stockage.ecrireMeta("device_id", nouveau);
  return nouveau;
}

/** Forme d'un changement sur le fil (docs/synchronisation.md §3). */
export function versFil(entree) {
  const change = { object_id: entree.objectId, kind: entree.kind, parent_id: entree.parentId, base_rev: entree.baseRev, deleted: entree.deleted };
  if (!entree.deleted) change.data = entree.data;
  return change;
}

const memeContenu = (a, b) => JSON.stringify([a?.parentId, a?.deleted, a?.data]) === JSON.stringify([b?.parentId, b?.deleted, b?.data]);

/** Indices de changements cités par les champs d'une erreur 422 (« changes.3.data.nom » → 3). */
function indicesRefuses(champs) {
  const indices = new Set();
  for (const cle of Object.keys(champs ?? {})) {
    const trouve = /^changes\.(\d+)(\.|$)/.exec(cle);
    if (trouve) indices.add(Number(trouve[1]));
  }
  return [...indices];
}

/**
 * `delaiOuvertureMs` : attente maximale de la première réception à l'ouverture d'un projet vide (0 : ne pas attendre ; Infinity : attendre sans limite, pour les tests).
 * @param {{
 *   stockage: import("./stockage-dexie.js").Stockage,
 *   api: ReturnType<import("../services/api.js").creerClient>,
 *   deviceId: string,
 *   maintenant?: () => string,
 *   delaiOuvertureMs?: number
 * }} options
 */
export function creerMoteur({ stockage, api, deviceId, maintenant = () => new Date().toISOString(), delaiOuvertureMs = 3000 }) {
  const ecouteurs = new Set();
  /** @type {Map<string, {objets: Map<string, any>, file: any[], seq: number, refusees: any[], archive: boolean, introuvable: boolean}>} */
  const projets = new Map();
  const verrous = new Map();
  const ouverts = new Set();
  const etat = { reseau: /** @type {"ok"|"hors-ligne"|"reconnexion"|"erreur"} */ ("ok"), derniereSynchro: /** @type {string|null} */ (null) };
  let operationsRefusees = [];
  let toutEnCours = null;
  let toutARejouer = false;

  const notifier = (evenement = { type: "etat" }) => ecouteurs.forEach((ecouteur) => ecouteur(evenement));
  const definirReseau = (reseau) => {
    if (etat.reseau !== reseau) {
      etat.reseau = reseau;
      notifier();
    }
  };

  /** Exécute `fn` après les opérations déjà en cours sur la même clé (les écritures d'un projet ne se chevauchent jamais). */
  function verrouiller(cle, fn) {
    const precedent = verrous.get(cle) ?? Promise.resolve();
    const suite = precedent.then(fn, fn);
    verrous.set(cle, suite.catch(() => {}));
    return suite;
  }

  async function chargerProjet(projetId) {
    if (!projets.has(projetId)) {
      const { objets, file, seq } = await stockage.chargerProjet(projetId);
      const refusees = (await stockage.lireMeta(`refusees:${projetId}`)) ?? [];
      projets.set(projetId, { objets: new Map(objets.map((o) => [o.id, o])), file, seq, refusees, archive: false, introuvable: false });
    }
    return projets.get(projetId);
  }

  function assemblerProjet(p) {
    const { batiment, avertissements, orphelins } = assemblerBatiment([...p.objets.values()], ID_BATIMENT);
    return { batiment, avertissements, orphelins };
  }

  /** Relevé enregistré localement. `persistant` est faux pour un projet qui n'a encore aucun contenu (bâtiment par défaut). */
  async function lireBatiment(projetId) {
    return verrouiller(projetId, async () => {
      const { batiment, avertissements } = assemblerProjet(await chargerProjet(projetId));
      return batiment ? { batiment, persistant: true, avertissements } : { batiment: batimentParDefaut(), persistant: false, avertissements: [] };
    });
  }

  /**
   * Ouverture d'un projet : le contenu local d'abord. Si l'appareil n'a rien et que le réseau semble disponible, on attend la
   * première réception (3 s au plus) avant de proposer un bâtiment par défaut, pour ne pas écraser un relevé fait ailleurs.
   */
  async function ouvrirProjet(projetId) {
    ouverts.add(projetId);
    let lu = await lireBatiment(projetId);
    if (!lu.persistant && etat.reseau !== "hors-ligne" && delaiOuvertureMs > 0) {
      const premiereReception = synchroniserProjet(projetId).catch(() => {});
      await (Number.isFinite(delaiOuvertureMs) ? Promise.race([premiereReception, new Promise((resolu) => setTimeout(resolu, delaiOuvertureMs))]) : premiereReception);
      lu = await lireBatiment(projetId);
    }
    return lu;
  }

  /**
   * Enregistrement automatique (R03) : compare l'état précédent et le nouvel état, écrit les objets modifiés et la file d'envoi
   * en une seule transaction locale. `avant` vaut `null` tant que le projet n'a rien d'enregistré. Retourne le nombre de changements.
   */
  function enregistrer(projetId, avant, apres) {
    return verrouiller(projetId, async () => {
      const p = await chargerProjet(projetId);
      const changements = diffBatiment(avant, apres);
      if (changements.length === 0) return 0;
      const touches = [];
      for (const c of changements) {
        const existant = p.objets.get(c.objectId);
        const objet = { id: c.objectId, kind: c.kind, parentId: c.parentId, data: c.data ?? existant?.data ?? null, rev: existant?.rev ?? 0, deleted: c.deleted };
        p.objets.set(objet.id, objet);
        touches.push(objet);
      }
      p.file = empiler(p.file, changements, (id) => p.objets.get(id)?.rev ?? 0);
      await stockage.sauverProjet(projetId, { objets: touches, file: p.file });
      notifier({ type: "local" });
      return changements.length;
    });
  }

  /** Gère l'échec d'un envoi. Retourne « reessayer » si la file a été allégée, sinon « arret ». */
  async function traiterErreur(projetId, lot, erreur) {
    if (!(erreur instanceof ErreurApi)) {
      definirReseau("erreur");
      return "arret";
    }
    if (estCoupure(erreur)) {
      definirReseau("hors-ligne");
      return "arret";
    }
    if (erreur.statut === 401) {
      definirReseau("reconnexion");
      return "arret";
    }
    return verrouiller(projetId, async () => {
      const p = await chargerProjet(projetId);
      if (erreur.statut === 409 && erreur.code === "project_archived") {
        p.archive = true;
        notifier();
        return "arret";
      }
      if (erreur.statut === 404) {
        p.introuvable = true; // le projet n'est pas encore (ou plus) connu du serveur : on réessaiera après l'envoi des projets
        notifier();
        return "arret";
      }
      if ([413, 422].includes(erreur.statut) && lot.length > 0) {
        const cites = indicesRefuses(erreur.champs).filter((i) => i < lot.length);
        const refuses = cites.length > 0 ? cites.map((i) => lot[i]) : lot; // sans indice : tout le lot, plutôt que de bloquer la file
        p.file = retirer(p.file, refuses.map((e) => e.objectId));
        p.refusees = [...p.refusees, ...refuses.map((e) => ({ objectId: e.objectId, kind: e.kind, message: erreur.message, le: maintenant() }))];
        await stockage.sauverProjet(projetId, { file: p.file });
        await stockage.ecrireMeta(`refusees:${projetId}`, p.refusees);
        notifier();
        return "reessayer";
      }
      definirReseau("erreur");
      return "arret";
    });
  }

  async function rafraichirJournal(projetId) {
    const connus = await stockage.lireJournal(projetId);
    const dernier = connus.length > 0 ? connus[connus.length - 1].id : 0;
    const nouvelles = await api.journal(projetId, dernier);
    if (nouvelles.length > 0) {
      await stockage.ajouterJournal(projetId, nouvelles);
      notifier({ type: "journal", projetId });
    }
  }

  /** Envoie la file du projet puis reçoit ce qui a changé (une ou plusieurs boucles). Ne lève jamais : l'état dit ce qui s'est passé. */
  async function synchroniserProjet(projetId) {
    let conflit = false;
    let autresAppareils = false;
    for (let tour = 0; tour < TOURS_MAX; tour += 1) {
      const prepare = await verrouiller(projetId, async () => {
        const p = await chargerProjet(projetId);
        return { lot: prendreLot(p.file, LOT_MAX), since: p.seq };
      });
      let reponse;
      try {
        reponse = await api.synchroniser(projetId, { deviceId, since: prepare.since, changes: prepare.lot.map(versFil) });
      } catch (erreur) {
        if ((await traiterErreur(projetId, prepare.lot, erreur)) === "reessayer") continue;
        return false;
      }
      const suite = await verrouiller(projetId, async () => {
        const p = await chargerProjet(projetId);
        const touches = new Map();
        for (const a of reponse.applied) {
          const objet = p.objets.get(a.object_id);
          if (a.rev > 0 && objet && objet.rev !== a.rev) {
            const maj = { ...objet, rev: a.rev };
            p.objets.set(maj.id, maj);
            touches.set(maj.id, maj);
          }
        }
        p.file = acquitter(p.file, prepare.lot, reponse.applied);
        const avant = p.objets;
        const { objets } = appliquerReception(avant, p.file, reponse.changes);
        let contenuModifie = false;
        for (const recu of reponse.changes) {
          const ancien = avant.get(recu.object_id);
          const nouveau = objets.get(recu.object_id);
          if (nouveau && nouveau !== ancien) {
            touches.set(nouveau.id, nouveau);
            if (!memeContenu(ancien, nouveau)) contenuModifie = true;
          }
        }
        p.objets = objets;
        p.seq = reponse.seq;
        p.archive = false;
        p.introuvable = false;
        await stockage.sauverProjet(projetId, { objets: [...touches.values()], file: p.file, seq: p.seq });
        return {
          contenuModifie,
          conflit: reponse.applied.some((a) => a.status === "conflict"),
          autresAppareils: reponse.changes.some((c) => c.device_id !== deviceId),
          encore: reponse.has_more || (p.file.length > 0 && prepare.lot.length > 0),
        };
      });
      conflit ||= suite.conflit;
      autresAppareils ||= suite.autresAppareils;
      definirReseau("ok");
      etat.derniereSynchro = maintenant();
      notifier(suite.contenuModifie ? { type: "projet", projetId } : { type: "etat" });
      if (!suite.encore) break;
    }
    if (conflit || autresAppareils) await rafraichirJournal(projetId).catch(() => {});
    return true;
  }

  // ---------------------------------------------------------------------------------------------- projets (liste et file)

  async function listerProjets() {
    const [lignes, operations] = await Promise.all([stockage.listerProjets(), stockage.lireOperations()]);
    const annotes = annoterProjets(lignes, operations);
    return annotes.sort((a, b) => String(b.updated_at ?? "").localeCompare(String(a.updated_at ?? "")) || a.id.localeCompare(b.id));
  }

  /** Création d'un projet, possible sans réseau : l'identifiant est choisi ici. */
  function creerProjet({ name, address = "", client_label = "" }) {
    return verrouiller("projets", async () => {
      // Les textes sont rognés comme le fait le serveur : l'état local et l'état du serveur restent identiques.
      name = name.trim();
      address = address.trim();
      client_label = client_label.trim();
      const id = genererIdProjet();
      const ligne = { id, name, address, client_label, status: "active", created_at: maintenant(), updated_at: maintenant() };
      await stockage.sauverProjets([ligne]);
      await stockage.ecrireOperations(empilerOperation(await stockage.lireOperations(), { type: "creer", id, champs: { name, address, client_label } }));
      notifier({ type: "local" });
      return { ...ligne, etat: "a-creer" };
    });
  }

  /** Renommage, modification ou archivage, possible sans réseau. */
  function modifierProjet(id, champs) {
    return verrouiller("projets", async () => {
      champs = Object.fromEntries(Object.entries(champs).map(([cle, valeur]) => [cle, cle === "status" ? valeur : String(valeur).trim()]));
      const existant = await stockage.lireProjet(id);
      if (!existant) return null;
      const ligne = { ...existant, ...champs, updated_at: maintenant() };
      await stockage.sauverProjets([ligne]);
      await stockage.ecrireOperations(empilerOperation(await stockage.lireOperations(), { type: "modifier", id, champs }));
      notifier({ type: "local" });
      return ligne;
    });
  }

  /**
   * Envoie les opérations de projets en attente, dans l'ordre. Le verrou n'est tenu que pour lire et écrire la file locale,
   * jamais pendant l'appel réseau : créer ou renommer un projet reste instantané pendant un envoi.
   * Retourne false si le réseau ou la session empêche d'aller plus loin.
   */
  async function synchroniserProjets() {
    // Plusieurs passes : un rejeu de création peut ajouter une modification à envoyer (champs différents sur le serveur).
    for (let passe = 0; passe < 5; passe += 1) {
      const depart = await verrouiller("projets", () => stockage.lireOperations());
      if (depart.length === 0) break;
      if (!(await envoyerOperations(depart))) return false;
    }
    definirReseau("ok");
    return true;
  }

  async function envoyerOperations(depart) {
    for (const operation of depart) {
      let serveur;
      try {
        serveur =
          operation.type === "creer"
            ? await api.creerProjet({ id: operation.id, ...operation.champs })
            : await api.modifierProjet(operation.id, operation.champs);
      } catch (erreur) {
        if (!(erreur instanceof ErreurApi)) {
          definirReseau("erreur");
          return false;
        }
        if (estCoupure(erreur)) {
          definirReseau("hors-ligne");
          return false;
        }
        if (erreur.statut === 401) {
          definirReseau("reconnexion");
          return false;
        }
        if ([403, 404, 409, 413, 422].includes(erreur.statut)) {
          // Refus définitif : l'opération sort de la file mais reste visible dans les refus, sans bloquer les suivantes.
          await verrouiller("projets", async () => {
            await stockage.ecrireOperations(retirerOperation(await stockage.lireOperations(), operation));
            operationsRefusees = [...operationsRefusees, { operation, message: erreur.message, le: maintenant() }];
          });
          notifier();
          continue;
        }
        definirReseau("erreur");
        return false;
      }
      await verrouiller("projets", async () => {
        let operations = retirerOperation(await stockage.lireOperations(), operation);
        if (operation.type === "creer") {
          const local = (await stockage.lireProjet(operation.id)) ?? operation.champs;
          const ecarts = ecartsDescriptifs(local, serveur);
          if (Object.keys(ecarts).length > 0) operations = empilerOperation(operations, { type: "modifier", id: operation.id, champs: ecarts });
        }
        await stockage.sauverProjets([appliquerOperations(serveur, operations)]);
        await stockage.ecrireOperations(operations);
      });
      notifier();
    }
    return true;
  }

  /** Remplace le cache local par la liste du serveur, sans écraser ce qui attend encore d'être envoyé. */
  async function rafraichirListe() {
    let serveur;
    try {
      serveur = await api.listerProjets({ statut: "all", limite: PROJETS_EN_CACHE });
    } catch (erreur) {
      if (erreur instanceof ErreurApi && estCoupure(erreur)) definirReseau("hors-ligne");
      else if (erreur instanceof ErreurApi && erreur.statut === 401) definirReseau("reconnexion");
      return false;
    }
    await verrouiller("projets", async () => {
      const operations = await stockage.lireOperations();
      const enAttente = new Set(operations.map((o) => o.id));
      await stockage.sauverProjets(serveur.map((projet) => appliquerOperations(projet, operations)));
      if (serveur.length < PROJETS_EN_CACHE) {
        const presents = new Set(serveur.map((p) => p.id));
        const absents = (await stockage.listerProjets()).filter((p) => !presents.has(p.id) && !enAttente.has(p.id)).map((p) => p.id);
        if (absents.length > 0) await stockage.retirerProjets(absents);
      }
      notifier();
    });
    return true;
  }

  /** Cycle complet : projets en attente, puis les projets ouverts ou ayant des modifications locales non envoyées. */
  function synchroniserTout() {
    if (toutEnCours) {
      toutARejouer = true;
      return toutEnCours;
    }
    toutEnCours = (async () => {
      try {
        do {
          toutARejouer = false;
          if (await synchroniserProjets()) {
            await rafraichirListe();
            const ids = new Set([...ouverts, ...(await stockage.listerProjetsEnAttente())]);
            for (const id of ids) {
              if (!(await synchroniserProjet(id))) break;
            }
          }
        } while (toutARejouer);
      } finally {
        toutEnCours = null;
      }
    })();
    return toutEnCours;
  }

  /** Nombre de modifications non envoyées (projet donné, ou tous les projets connus plus les opérations sur les projets). */
  async function compterEnAttente(projetId) {
    if (projetId) return (await chargerProjet(projetId)).file.length;
    const operations = await stockage.lireOperations();
    let total = operations.length;
    for (const id of new Set([...projets.keys(), ...(await stockage.listerProjetsEnAttente())])) total += (await chargerProjet(id)).file.length;
    return total;
  }

  return {
    etat: () => ({ ...etat }),
    abonner(ecouteur) {
      ecouteurs.add(ecouteur);
      return () => ecouteurs.delete(ecouteur);
    },
    deviceId,
    lireBatiment,
    ouvrirProjet,
    fermerProjet: (projetId) => ouverts.delete(projetId),
    enregistrer,
    synchroniserProjet,
    synchroniserProjets,
    synchroniserTout,
    rafraichirListe,
    listerProjets,
    creerProjet,
    modifierProjet,
    compterEnAttente,
    lireJournal: (projetId) => stockage.lireJournal(projetId),
    async etatProjet(projetId) {
      const p = await chargerProjet(projetId);
      return { enAttente: p.file.length, refusees: [...p.refusees], archive: p.archive, introuvable: p.introuvable };
    },
    operationsRefusees: () => [...operationsRefusees],
  };
}
