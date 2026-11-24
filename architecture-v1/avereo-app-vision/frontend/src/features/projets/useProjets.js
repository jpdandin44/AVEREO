// État de la session et des projets (R01, R08) : identité, liste, création, modification, archivage.
import { useCallback, useEffect, useState } from "react";
import { ErreurApi } from "../../services/api.js";

/** Convertit une erreur d'API en état de session ou en message lisible. */
export function decrireErreur(erreur) {
  if (erreur instanceof ErreurApi) {
    if (erreur.statut === 401) return { type: "non-connecte", message: erreur.message };
    if (erreur.statut === 0) return { type: "reseau", message: erreur.message };
    return { type: "erreur", message: erreur.message, champs: erreur.champs };
  }
  return { type: "erreur", message: "Une erreur inattendue est survenue.", champs: {} };
}

/**
 * @param {ReturnType<import("../../services/api.js").creerClient>} client
 */
export function useProjets(client) {
  const [session, setSession] = useState({ etat: "chargement" });
  const [projets, setProjets] = useState([]);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState(null);
  const [filtres, setFiltres] = useState({ statut: "active", q: "" });

  const verifierSession = useCallback(async () => {
    setSession({ etat: "chargement" });
    try {
      const identite = await client.identite();
      setSession({ etat: "ok", identite: identite.identity, role: identite.role, droits: identite.droits, modeAuth: identite.auth_mode });
    } catch (e) {
      const d = decrireErreur(e);
      setSession({ etat: d.type === "non-connecte" ? "non-connecte" : d.type === "reseau" ? "reseau" : "erreur", message: d.message });
    }
  }, [client]);

  const charger = useCallback(async () => {
    setChargement(true);
    try {
      setProjets(await client.listerProjets({ statut: filtres.statut, q: filtres.q }));
      setErreur(null);
    } catch (e) {
      const d = decrireErreur(e);
      if (d.type === "non-connecte") setSession({ etat: "non-connecte", message: d.message });
      setErreur(d);
    } finally {
      setChargement(false);
    }
  }, [client, filtres.statut, filtres.q]);

  useEffect(() => {
    verifierSession();
  }, [verifierSession]);

  useEffect(() => {
    if (session.etat === "ok") charger();
  }, [session.etat, charger]);

  /** Exécute une écriture ; renvoie {ok: true, projet} ou {ok: false, erreur}. */
  const ecrire = useCallback(
    async (action) => {
      try {
        const projet = await action();
        await charger();
        return { ok: true, projet };
      } catch (e) {
        const d = decrireErreur(e);
        if (d.type === "non-connecte") setSession({ etat: "non-connecte", message: d.message });
        return { ok: false, erreur: d };
      }
    },
    [charger],
  );

  return {
    session,
    projets,
    chargement,
    erreur,
    filtres,
    changerFiltres: (suite) => setFiltres((actuels) => ({ ...actuels, ...suite })),
    recharger: charger,
    reessayer: verifierSession,
    deconnecter: async () => {
      try {
        await client.deconnecter();
      } finally {
        setProjets([]);
        verifierSession();
      }
    },
    creer: (donnees) => ecrire(() => client.creerProjet(donnees)),
    modifier: (id, changements) => ecrire(() => client.modifierProjet(id, changements)),
  };
}
