// État de la session et des projets (R01, R08) : identité, liste, création, modification, archivage.
// Local d'abord (Lot 2B) : la liste vient du stockage de l'appareil et reste utilisable sans réseau ; créations, renommages et
// archivages sont enregistrés tout de suite puis envoyés au serveur par le moteur de synchronisation.
import { useCallback, useEffect, useMemo, useState } from "react";
import { ErreurApi, estCoupure } from "../../services/api.js";
import { lireIdentiteConnue, memoriserIdentite, oublierIdentite } from "../../sync/identite-locale.js";
import { validerChampsProjet } from "../../sync/operations-projets.js";
import { useMoteur } from "../../sync/useMoteur.js";

const PAGE = 50;
const LIMITE_MAX = 200;

/** Convertit une erreur d'API en état de session ou en message lisible. */
export function decrireErreur(erreur) {
  if (erreur instanceof ErreurApi) {
    if (erreur.statut === 401) return { type: "non-connecte", message: erreur.message };
    if (estCoupure(erreur)) return { type: "reseau", message: erreur.message };
    return { type: "erreur", message: erreur.message, champs: erreur.champs };
  }
  return { type: "erreur", message: "Une erreur inattendue est survenue.", champs: {} };
}

const normaliser = (texte) => String(texte ?? "").toLocaleLowerCase("fr").normalize("NFD").replace(/\p{Diacritic}/gu, "");

/** Filtre local : statut et recherche (nom, adresse, client), sans tenir compte des accents ni de la casse. */
export function filtrerProjets(lignes, { statut, q }) {
  const mot = normaliser(q).trim();
  return lignes.filter(
    (p) =>
      (statut === "all" || p.status === statut) &&
      (mot === "" || [p.name, p.address, p.client_label].some((champ) => normaliser(champ).includes(mot))),
  );
}

/**
 * @param {ReturnType<import("../../services/api.js").creerClient>} client
 */
export function useProjets(client) {
  const [session, setSession] = useState({ etat: "chargement" });
  const [lignes, setLignes] = useState([]);
  const [filtres, setFiltres] = useState({ statut: "active", q: "" });
  const [limite, setLimite] = useState(PAGE);
  const pret = useMoteur(client, session.etat === "ok" ? session.identite : null);
  const moteur = pret?.moteur ?? null;
  const [reseau, setReseau] = useState("ok");

  const verifierSession = useCallback(async () => {
    setSession({ etat: "chargement" });
    try {
      const identite = await client.identite();
      memoriserIdentite({ ...identite.identity, role: identite.role, modeAuth: identite.auth_mode });
      setSession({ etat: "ok", identite: identite.identity, role: identite.role, droits: identite.droits, modeAuth: identite.auth_mode });
    } catch (e) {
      const d = decrireErreur(e);
      const connue = d.type === "reseau" ? lireIdentiteConnue() : null;
      if (connue) {
        // Sans réseau : on rouvre l'application avec la dernière identité connue de cet appareil (le serveur la reverifiera à l'envoi).
        setSession({ etat: "ok", horsLigne: true, identite: { provider: connue.provider, id: connue.id }, role: connue.role ?? "conseiller", droits: [], modeAuth: connue.modeAuth });
      } else {
        setSession({ etat: d.type === "non-connecte" ? "non-connecte" : d.type === "reseau" ? "reseau" : "erreur", message: d.message });
      }
    }
  }, [client]);

  const charger = useCallback(async () => {
    if (moteur) setLignes(await moteur.listerProjets());
  }, [moteur]);

  useEffect(() => {
    verifierSession();
  }, [verifierSession]);

  useEffect(() => {
    if (!moteur) {
      setLignes([]);
      return undefined;
    }
    charger();
    setReseau(moteur.etat().reseau);
    return moteur.abonner(() => {
      charger();
      setReseau(moteur.etat().reseau);
    });
  }, [moteur, charger]);

  const filtres_ = useMemo(() => filtrerProjets(lignes, filtres), [lignes, filtres]);
  const visibles = useMemo(() => filtres_.slice(0, limite), [filtres_, limite]);

  /** Exécute une écriture locale ; renvoie {ok: true, projet} ou {ok: false, erreur}. */
  const ecrire = useCallback(
    async (donnees, creation, action) => {
      const champs = validerChampsProjet(donnees, { creation });
      if (Object.keys(champs).length > 0) return { ok: false, erreur: { type: "erreur", message: "Données invalides.", champs } };
      if (!moteur) return { ok: false, erreur: { type: "erreur", message: "L'application n'est pas prête.", champs: {} } };
      const projet = await action();
      await charger();
      return { ok: true, projet };
    },
    [moteur, charger],
  );

  return {
    session,
    moteur,
    stockageDurable: pret?.durable ?? true,
    projets: visibles,
    chargement: session.etat === "ok" && moteur === null,
    // Liste vide ET serveur injoignable ou en erreur : on le dit, au lieu d'afficher « Aucun projet ».
    erreur:
      lignes.length === 0 && ["hors-ligne", "erreur", "autre-compte", "reconnexion"].includes(reseau)
        ? {
            type: reseau === "erreur" ? "erreur" : "reseau",
            message:
              reseau === "erreur"
                ? "Le serveur ne répond pas correctement. Vos projets n'ont pas pu être chargés."
                : reseau === "autre-compte"
                  ? "Un autre compte est connecté : rechargez la page."
                  : "Aucun projet n'est enregistré sur cet appareil et le serveur est injoignable : connectez-vous au réseau pour charger vos projets.",
          }
        : null,
    filtres,
    // changer de recherche ou de filtre repart de la première page
    changerFiltres: (suite) => {
      setLimite(PAGE);
      setFiltres((actuels) => ({ ...actuels, ...suite }));
    },
    limite,
    afficherPlus: () => setLimite((actuelle) => Math.min(LIMITE_MAX, actuelle + PAGE)),
    pageComplete: filtres_.length > limite,
    limiteMax: LIMITE_MAX,
    recharger: async () => {
      await moteur?.rafraichirListe();
      await charger();
    },
    reessayer: verifierSession,
    deconnecter: async () => {
      oublierIdentite();
      try {
        await client.deconnecter();
      } finally {
        setLignes([]);
        verifierSession();
      }
    },
    creer: (donnees) => ecrire(donnees, true, () => moteur.creerProjet(donnees)),
    modifier: (id, changements) => ecrire(changements, false, () => moteur.modifierProjet(id, changements)),
  };
}
