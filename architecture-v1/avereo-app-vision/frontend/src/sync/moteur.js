// Moteur de synchronisation (R03, R04, R05, R06) : enregistrement local immédiat, file d'envoi, envoi et réception.
// Contrat : docs/synchronisation.md. Le moteur ne connaît ni React ni le DOM : le stockage, l'API et l'horloge sont injectés,
// ce qui permet de le tester sans navigateur. Les déclencheurs (minuterie de 30 s, retour du réseau, retour d'onglet) sont dans useSynchro.js.
//
// Plusieurs onglets peuvent partager la même base locale : le moteur ne garde AUCUN état de projet en mémoire. Chaque opération relit
// l'état enregistré sous un verrou (Web Locks entre onglets quand le navigateur les offre, sinon une file dans l'onglet), puis réécrit.
import { creerBatiment, creerNiveau } from "../domain/modele.js";
import { ErreurApi, estCoupure } from "../services/api.js";
import { assemblerBatiment } from "./assembler.js";
import { diffBatiment } from "./diff.js";
import { acquitter, empiler, marquerEnvoyees, prendreLot, retirerVersions } from "./file-envoi.js";
import { appliquerReception } from "./fusion.js";
import { annoterProjets, appliquerOperations, ecartsDescriptifs, empilerOperation, genererIdProjet, retirerOperation } from "./operations-projets.js";

export const ID_BATIMENT = "batiment-1";
export const ID_NIVEAU = "niveau-1";
const LOT_MAX = 100;
const TOURS_MAX = 20;
const PROJETS_EN_CACHE = 200;
const PRECHARGEMENTS_PAR_CYCLE = 20;

/** Numéro de version d'entrée de file : croissant et non réutilisable (horloge + aléa), y compris entre onglets. */
function versionUnique() {
  const alea = globalThis.crypto?.getRandomValues ? globalThis.crypto.getRandomValues(new Uint16Array(1))[0] % 1000 : Math.floor(Math.random() * 1000);
  return Date.now() * 1000 + alea;
}

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
 * @param {{
 *   stockage: import("./stockage-dexie.js").Stockage,
 *   api: ReturnType<import("../services/api.js").creerClient>,
 *   deviceId: string,
 *   maintenant?: () => string,
 *   delaiOuvertureMs?: number,
 *   nomCanal?: string,
 *   verrouExterne?: (cle: string, fn: () => Promise<any>) => Promise<any>
 * }} options
 * `delaiOuvertureMs` : attente maximale de la première réception à l'ouverture d'un projet vide (0 : ne pas attendre ;
 * Infinity : attendre sans limite, pour les tests). `nomCanal` : nom commun aux onglets d'un même compte (verrous et messages).
 */
export function creerMoteur({ stockage, api, deviceId, maintenant = () => new Date().toISOString(), delaiOuvertureMs = 3000, nomCanal = "", verrouExterne }) {
  const ecouteurs = new Set();
  const verrous = new Map();
  const drapeaux = new Map(); // état de session de l'onglet (projet archivé, introuvable, taille de lot) : jamais persisté
  const ouverts = new Set();
  const etat = { reseau: /** @type {"ok"|"hors-ligne"|"reconnexion"|"autre-compte"|"erreur"} */ ("ok"), derniereSynchro: /** @type {string|null} */ (null) };
  let operationsRefusees = [];
  let toutEnCours = null;
  let toutARejouer = false;
  const canal = nomCanal && typeof BroadcastChannel !== "undefined" ? new BroadcastChannel(`vision:${nomCanal}`) : null;
  // Verrou entre onglets : Web Locks quand le navigateur les offre (ou un verrou fourni, pour les tests).
  const verrousWeb = nomCanal ? globalThis.navigator?.locks : undefined;
  const entreOnglets = verrouExterne ?? (verrousWeb ? (cle, fn) => verrousWeb.request(`vision:${nomCanal}:${cle}`, () => fn()) : null);

  const prevenir = (evenement) => ecouteurs.forEach((ecouteur) => ecouteur(evenement));
  if (canal) canal.onmessage = (message) => prevenir(message.data); // un autre onglet a écrit : on relit
  const notifier = (evenement = { type: "etat" }) => {
    prevenir(evenement);
    // Un enregistrement local d'un projet est annoncé aux autres onglets comme « contenu modifié » : ils relisent le relevé.
    canal?.postMessage(evenement.type === "local" ? (evenement.projetId ? { type: "projet", projetId: evenement.projetId } : { type: "etat" }) : evenement);
  };
  const definirReseau = (reseau) => {
    if (etat.reseau !== reseau) {
      etat.reseau = reseau;
      notifier();
    }
  };
  const drapeauxProjet = (projetId) => {
    if (!drapeaux.has(projetId)) drapeaux.set(projetId, { archive: false, introuvable: false, lotMax: LOT_MAX, journalARelire: false });
    return drapeaux.get(projetId);
  };

  /** Exécute `fn` après les opérations déjà en cours sur la même clé, dans cet onglet et (si possible) entre onglets. */
  function verrouiller(cle, fn) {
    const precedent = verrous.get(cle) ?? Promise.resolve();
    const executer = () => (entreOnglets ? entreOnglets(cle, fn) : fn());
    const suite = precedent.then(executer, executer);
    verrous.set(cle, suite.catch(() => {}));
    return suite;
  }

  /** État enregistré d'un projet, relu à chaque appel (à utiliser sous verrou). */
  async function chargerProjet(projetId) {
    const { objets, file, seq } = await stockage.chargerProjet(projetId);
    const refusees = (await stockage.lireMeta(`refusees:${projetId}`)) ?? [];
    return { objets: new Map(objets.map((o) => [o.id, o])), file, seq, refusees };
  }

  /** Relevé enregistré localement. `persistant` est faux pour un projet qui n'a encore aucun contenu (bâtiment par défaut). */
  function lireBatiment(projetId) {
    return verrouiller(projetId, async () => {
      const p = await chargerProjet(projetId);
      const { batiment, avertissements } = assemblerBatiment([...p.objets.values()], ID_BATIMENT);
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
    return verrouiller(projetId, () => enregistrerInterne(projetId, avant, apres));
  }
  async function enregistrerInterne(projetId, avant, apres) {
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
      const file = empiler(p.file, changements, (id) => p.objets.get(id)?.rev ?? 0, versionUnique);
      await stockage.sauverProjet(projetId, { objets: touches, file });
      notifier({ type: "local", projetId });
      return changements.length;
  }

  /**
   * Gère l'échec d'un envoi. Retourne « reessayer » (la file a été allégée ou le lot réduit), « recevoir-seul » (projet archivé :
   * on peut encore lire) ou « arret ».
   */
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
    if (erreur.statut === 409 && erreur.code === "identity_changed") {
      definirReseau("autre-compte");
      return "arret";
    }
    const d = drapeauxProjet(projetId);
    if (erreur.statut === 409 && erreur.code === "project_archived") {
      d.archive = true;
      notifier();
      return "recevoir-seul";
    }
    if (erreur.statut === 404) {
      d.introuvable = true; // le projet n'est pas encore (ou plus) connu du serveur : on réessaiera après l'envoi des projets
      notifier();
      return "arret";
    }
    if ([413, 422].includes(erreur.statut) && lot.length > 0) {
      const champs = Object.keys(erreur.champs ?? {});
      if (champs.some((cle) => !cle.startsWith("changes."))) {
        definirReseau("erreur"); // erreur d'enveloppe (appareil, curseur) : ce n'est la faute d'aucune modification
        return "arret";
      }
      const cites = indicesRefuses(erreur.champs).filter((i) => i < lot.length);
      if (cites.length === 0 && lot.length > 1) {
        // Le serveur ne désigne pas le fautif (plafond de projet, corps trop gros) : on réduit le lot de moitié jusqu'à l'isoler,
        // pour que les modifications valides partent quand même.
        d.lotMax = Math.ceil(lot.length / 2);
        return "reessayer";
      }
      const refuses = cites.length > 0 ? cites.map((i) => lot[i]) : lot;
      await verrouiller(projetId, async () => {
        const p = await chargerProjet(projetId);
        // Seule la version envoyée est retirée : une correction faite pendant l'envoi reste dans la file.
        const file = retirerVersions(p.file, refuses);
        const refusees = [
          ...p.refusees,
          ...refuses.map((e) => ({ objectId: e.objectId, kind: e.kind, message: erreur.message, le: maintenant(), deleted: e.deleted, data: e.data })),
        ];
        await stockage.sauverProjet(projetId, { file });
        await stockage.ecrireMeta(`refusees:${projetId}`, refusees);
      });
      notifier();
      return "reessayer";
    }
    definirReseau("erreur");
    return "arret";
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
    let lectureSeule = false;
    for (let tour = 0; tour < TOURS_MAX; tour += 1) {
      const d = drapeauxProjet(projetId);
      const prepare = await verrouiller(projetId, async () => {
        const p = await chargerProjet(projetId);
        let lot = prendreLot(p.file, d.lotMax);
        if (lot.length > 0) {
          // Avant l'appel : ces entrées sont peut-être reçues par le serveur sans que la réponse nous parvienne.
          const file = marquerEnvoyees(p.file, lot);
          await stockage.sauverProjet(projetId, { file });
          lot = prendreLot(file, d.lotMax);
        }
        return { lot, since: p.seq };
      });
      let reponse;
      try {
        reponse =
          prepare.lot.length === 0 || lectureSeule
            ? { applied: [], ...(await api.recevoir(projetId, prepare.since)) }
            : await api.synchroniser(projetId, { deviceId, since: prepare.since, changes: prepare.lot.map(versFil) });
      } catch (erreur) {
        const decision = await traiterErreur(projetId, prepare.lot, erreur);
        if (decision === "reessayer") continue;
        if (decision === "recevoir-seul") {
          // Projet archivé : les modifications locales attendent la réactivation, mais on reçoit quand même celles des autres appareils.
          lectureSeule = true;
          continue;
        }
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
        const file = acquitter(p.file, prepare.lot, reponse.applied);
        const avant = p.objets;
        const { objets } = appliquerReception(avant, file, reponse.changes);
        let contenuModifie = false;
        for (const recu of reponse.changes) {
          const ancien = avant.get(recu.object_id);
          const nouveau = objets.get(recu.object_id);
          if (nouveau && nouveau !== ancien) {
            touches.set(nouveau.id, nouveau);
            if (!memeContenu(ancien, nouveau)) contenuModifie = true;
          }
        }
        await stockage.sauverProjet(projetId, { objets: [...touches.values()], file, seq: reponse.seq });
        if (!lectureSeule) {
          d.archive = false;
          d.lotMax = LOT_MAX;
        }
        d.introuvable = false;
        return {
          contenuModifie,
          conflit: reponse.applied.some((a) => a.status === "conflict"),
          autresAppareils: reponse.changes.some((c) => c.device_id !== deviceId),
          encore: reponse.has_more || (!lectureSeule && file.length > 0 && prepare.lot.length > 0),
        };
      });
      conflit ||= suite.conflit;
      autresAppareils ||= suite.autresAppareils;
      definirReseau("ok");
      etat.derniereSynchro = maintenant();
      notifier(suite.contenuModifie ? { type: "projet", projetId } : { type: "etat" });
      if (!suite.encore) break;
    }
    const d = drapeauxProjet(projetId);
    if (conflit || autresAppareils) d.journalARelire = true;
    if (d.journalARelire) {
      // Le journal est relu jusqu'à y parvenir : une erreur réseau ne doit pas faire oublier un écrasement.
      d.journalARelire = !(await rafraichirJournal(projetId).then(() => true, () => false));
    }
    if (!lectureSeule) await synchroniserMedias(projetId);
    return !lectureSeule;
  }

  function synchroniserMedias(projetId) {
    return verrouiller(`medias:${projetId}`, () => envoyerMedias(projetId));
  }
  async function envoyerMedias(projetId) {
    if (!stockage.listerMedias) return;
    for (const media of await stockage.listerMedias(projetId)) {
      if (media.etat !== "a-envoyer" || media.erreur) continue;
      const p = await chargerProjet(projetId);
      const objet = p.objets.get(media.id);
      if (p.file.some(e => e.objectId === media.id)) continue;
      if (!media.supprimer && (!objet || objet.deleted || objet.rev < 1)) continue;
      try {
        if (media.supprimer) await api.supprimerMedia(projetId, media.id);
        else await api.envoyerMedia(projetId, media);
        // Relire : une suppression locale peut avoir été demandée pendant le PUT.
        const actuel = await stockage.lireMedia(projetId, media.id);
        if (actuel?.supprimer && !media.supprimer) continue;
        if (media.supprimer) await stockage.retirerMedia(projetId, media.id);
        else await stockage.sauverMedia({ ...actuel, etat: "envoye" });
      } catch (e) {
        if (e.statut === 401) { definirReseau("reconnexion"); return; }
        if (e.statut === 409 && e.code === "identity_changed") { definirReseau("autre-compte"); return; }
        if (media.supprimer && e.statut === 404) { await stockage.retirerMedia(projetId, media.id); continue; }
        if (e.statut >= 400 && e.statut < 500) {
          const actuel = await stockage.lireMedia(projetId, media.id);
          await stockage.sauverMedia({ ...actuel, erreur: { statut: e.statut, message: e.message } });
          notifier({ type: "media-refuse", projetId, id: media.id });
        } else { definirReseau(estCoupure(e) ? "hors-ligne" : "erreur"); return; }
      }
    }
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
        if (erreur.statut === 409 && erreur.code === "identity_changed") {
          definirReseau("autre-compte");
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
      else if (erreur instanceof ErreurApi && erreur.statut === 409 && erreur.code === "identity_changed") definirReseau("autre-compte");
      else definirReseau("erreur"); // erreur du serveur (500, 503…) : l'écran doit le dire, pas afficher « aucun projet »
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

  /**
   * Préchargement (R04) : le contenu des projets actifs jamais reçus sur cet appareil est téléchargé quand le réseau est là,
   * pour qu'un relevé préparé au bureau s'ouvre ensuite chez le client, même sans réseau. Quelques projets par cycle.
   */
  async function prechargerProjets(dejaFaits) {
    const actifs = (await stockage.listerProjets()).filter((p) => p.status === "active" && !dejaFaits.has(p.id));
    let faits = 0;
    for (const projet of actifs) {
      if (faits >= PRECHARGEMENTS_PAR_CYCLE || etat.reseau !== "ok") break;
      const operations = await stockage.lireOperations();
      if (operations.some((o) => o.type === "creer" && o.id === projet.id)) continue; // pas encore connu du serveur
      // Suivi indépendant du curseur : le marqueur garde la date de modification du projet reçue ; il faut recevoir de nouveau
      // quand elle change (relevé complété au bureau). Une réception interrompue n'est pas marquée et reprend au cycle suivant.
      const version = projet.updated_at ?? "";
      if ((await stockage.lireMeta(`precharge:${projet.id}`)) === version) continue;
      faits += 1;
      if (await synchroniserProjet(projet.id)) await stockage.ecrireMeta(`precharge:${projet.id}`, version);
    }
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
            const ids = new Set([...ouverts, ...(await stockage.listerProjetsEnAttente()), ...((await stockage.lireMeta("projets-medias")) ?? [])]);
            for (const id of ids) {
              // Un projet archivé ou introuvable n'empêche pas les suivants ; une coupure, une session perdue ou une erreur serveur, si.
              await synchroniserProjet(id);
              if (etat.reseau !== "ok") break;
            }
            if (etat.reseau === "ok") await prechargerProjets(ids);
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
    if (projetId) return (await stockage.chargerProjet(projetId)).file.length + ((await stockage.listerMedias?.(projetId)) ?? []).filter(m => m.etat === "a-envoyer").length;
    const operations = await stockage.lireOperations();
    let total = operations.length;
    for (const id of new Set([...ouverts, ...(await stockage.listerProjetsEnAttente()), ...((await stockage.lireMeta("projets-medias")) ?? [])])) total += await compterEnAttente(id);
    return total;
  }

  return {
    etat: () => ({ ...etat }),
    abonner(ecouteur) {
      ecouteurs.add(ecouteur);
      return () => ecouteurs.delete(ecouteur);
    },
    fermer() {
      ecouteurs.clear();
      canal?.close();
    },
    deviceId,
    async sauverMedia(media) {
      await stockage.sauverMedia(media);
      await verrouiller("projets-medias", async () => stockage.ecrireMeta("projets-medias", [...new Set([...(await stockage.lireMeta("projets-medias") ?? []), media.projectId])]));
      notifier({ type: "local", projetId: media.projectId });
    },
    lireMedia: (projectId, id) => stockage.lireMedia(projectId, id),
    listerMedias: (projectId) => stockage.listerMedias(projectId),
    async reessayerMedia(projectId, id) {
      const media = await stockage.lireMedia(projectId, id);
      if (media) await stockage.sauverMedia({ ...media, erreur: null });
      notifier({ type: "local", projetId: projectId });
    },
    telechargerMedia: (projectId, id) => api.telechargerMedia(projectId, id),
    modifierBatiment(projetId, modifier) {
      return verrouiller(projetId, async () => {
        const p = await chargerProjet(projetId);
        const avant = assemblerBatiment([...p.objets.values()], ID_BATIMENT).batiment;
        return enregistrerInterne(projetId, avant, modifier(avant ?? batimentParDefaut()));
      });
    },
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
      const [{ file }, refusees] = [await stockage.chargerProjet(projetId), (await stockage.lireMeta(`refusees:${projetId}`)) ?? []];
      const d = drapeauxProjet(projetId);
      return { enAttente: file.length, refusees, archive: d.archive, introuvable: d.introuvable };
    },
    operationsRefusees: () => [...operationsRefusees],
  };
}
