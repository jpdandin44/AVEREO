// Client de l'API AVEREO Vision (R01, R08). Toutes les requêtes vont vers le même site (/api/…) : aucune adresse externe.
// Authentification : en production, le cookie de passerelle CONNECT (envoyé automatiquement, HttpOnly, invisible du code).
// En développement local seulement, un jeton de test peut être lu dans frontend/.env.development.local (jamais embarqué
// dans un build : ce fichier n'est lu que par `npm run dev`).

/** Le serveur est injoignable : coupure réseau (statut 0) ou passerelle sans réponse (502, 504). @param {{statut: number}} erreur */
export function estCoupure(erreur) {
  return erreur.statut === 0 || erreur.statut === 502 || erreur.statut === 504;
}

/** Erreur renvoyée par l'API : code court stable, message en français, champs invalides éventuels. */
export class ErreurApi extends Error {
  /**
   * @param {number} statut
   * @param {string} code
   * @param {string} message
   * @param {Record<string, string>} [champs]
   */
  constructor(statut, code, message, champs = {}) {
    super(message);
    this.name = "ErreurApi";
    this.statut = statut;
    this.code = code;
    this.champs = champs;
  }
}

/**
 * @param {{fetchImpl?: typeof fetch, base?: string, jeton?: string, utilisateur?: string}} [options]
 */
export function creerClient({ fetchImpl = (...a) => globalThis.fetch(...a), base = "/api/", jeton = "", utilisateur = "" } = {}) {
  async function appeler(methode, fichier, { requete = {}, corps } = {}) {
    const parametres = new URLSearchParams();
    for (const [cle, valeur] of Object.entries(requete)) {
      if (valeur !== undefined && valeur !== null && valeur !== "") parametres.set(cle, String(valeur));
    }
    const texte = parametres.toString();
    const entetes = { Accept: "application/json" };
    if (jeton) {
      entetes.Authorization = `Bearer ${jeton}`;
      if (utilisateur) entetes["X-Vision-Local-User"] = utilisateur;
    }
    const options = { method: methode, headers: entetes, credentials: "same-origin" };
    if (corps !== undefined) {
      entetes["Content-Type"] = "application/json";
      options.body = JSON.stringify(corps);
    }
    let reponse;
    try {
      reponse = await fetchImpl(`${base}${fichier}${texte ? `?${texte}` : ""}`, options);
    } catch {
      throw new ErreurApi(0, "reseau", "Le serveur est injoignable. Vérifiez votre connexion.");
    }
    let donnees = null;
    try {
      donnees = await reponse.json();
    } catch {
      donnees = null;
    }
    // Notre API répond toujours en JSON : une erreur 5xx sans JSON vient d'une passerelle ou d'un proxy (serveur arrêté,
    // page de maintenance). Pour l'utilisateur c'est une coupure : les modifications restent sur l'appareil et partiront plus tard.
    if (donnees === null && reponse.status >= 500) {
      throw new ErreurApi(0, "reseau", "Le serveur est injoignable. Vérifiez votre connexion.");
    }
    if (!reponse.ok || !donnees || donnees.ok === false) {
      throw new ErreurApi(
        reponse.status,
        donnees?.error ?? "erreur",
        donnees?.message ?? "Une erreur est survenue.",
        donnees?.fields ?? {},
      );
    }
    return donnees;
  }

  return {
    /** Identité, rôle et droits de la session. */
    identite: () => appeler("GET", "auth.php"),
    /** Efface le cookie de passerelle (mode CONNECT). */
    deconnecter: () => appeler("POST", "logout.php", { corps: {} }),
    /** @param {{statut?: "active"|"archived"|"all", q?: string, limite?: number, decalage?: number}} [filtres] */
    listerProjets: async ({ statut = "active", q = "", limite = 50, decalage = 0 } = {}) =>
      (await appeler("GET", "projects.php", { requete: { status: statut, q, limit: limite, offset: decalage } })).projects,
    lireProjet: async (id) => (await appeler("GET", "projects.php", { requete: { id } })).project,
    /** @param {{id?: string, name: string, address?: string, client_label?: string}} donnees  « id » : identifiant choisi par le navigateur (création hors ligne) */
    creerProjet: async (donnees) => (await appeler("POST", "projects.php", { corps: donnees })).project,
    /** @param {string} id @param {{name?: string, address?: string, client_label?: string, status?: "active"|"archived"}} changements */
    modifierProjet: async (id, changements) =>
      (await appeler("PATCH", "projects.php", { requete: { id }, corps: changements })).project,
    /**
     * Synchronisation d'un projet (docs/synchronisation.md) : envoie les modifications puis reçoit ce qui a changé.
     * @param {string} projetId
     * @param {{deviceId: string, since: number, changes: object[]}} envoi
     * @returns {Promise<{applied: any[], changes: any[], seq: number, has_more: boolean}>}
     */
    synchroniser: async (projetId, { deviceId, since, changes }) =>
      appeler("POST", "sync.php", { requete: { project: projetId }, corps: { device_id: deviceId, since, changes } }),
    /** Réception seule des objets modifiés depuis `since`. @returns {Promise<{changes: any[], seq: number, has_more: boolean}>} */
    recevoir: async (projetId, since) => appeler("GET", "sync.php", { requete: { project: projetId, since } }),
    /** Journal des écrasements d'un projet, après l'entrée `apres`. */
    journal: async (projetId, apres = 0) =>
      (await appeler("GET", "sync.php", { requete: { project: projetId, journal: 1, after: apres || undefined } })).entries,
  };
}

/** Client de l'application : jeton de test lu seulement en développement. */
export function creerClientApplication() {
  if (import.meta.env.DEV) {
    return creerClient({
      jeton: import.meta.env.VITE_LOCAL_API_TOKEN ?? "",
      utilisateur: import.meta.env.VITE_LOCAL_USER ?? "",
    });
  }
  return creerClient();
}
