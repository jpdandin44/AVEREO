// Déclencheurs de la synchronisation (R05) : à l'ouverture, après chaque enregistrement local (1,5 s), au retour du réseau,
// au retour de l'onglet au premier plan et toutes les 30 s. Aucun temps réel (pas de WebSocket en V1).
import { useCallback, useEffect, useRef, useState } from "react";

export const INTERVALLE_MS = 30_000;
export const DELAI_APRES_ENREGISTREMENT_MS = 1_500;

/**
 * @param {ReturnType<import("./moteur.js").creerMoteur>|null} moteur
 * @returns {{reseau: "ok"|"hors-ligne"|"reconnexion"|"erreur", enAttente: number, derniereSynchro: string|null, synchroniser: () => void}}
 */
export function useSynchro(moteur) {
  const [etat, setEtat] = useState({ reseau: "ok", enAttente: 0, derniereSynchro: null });
  const lancerRef = useRef(() => {});

  useEffect(() => {
    if (!moteur) return undefined;
    let vivant = true;
    let minuterie = null;

    const rafraichir = async () => {
      const enAttente = await moteur.compterEnAttente().catch(() => 0);
      if (vivant) setEtat({ ...moteur.etat(), enAttente });
    };
    const lancer = async () => {
      if (!vivant) return;
      if (globalThis.navigator?.onLine === false) {
        await rafraichir();
        return;
      }
      try {
        await moteur.synchroniserTout();
        await rafraichir();
      } catch {
        // Moteur fermé pendant le cycle (changement de compte, démontage) : le cycle suivant du nouveau moteur reprend.
      }
    };
    lancerRef.current = lancer;

    const desabonner = moteur.abonner((evenement) => {
      rafraichir();
      if (evenement.type === "local") {
        clearTimeout(minuterie);
        minuterie = setTimeout(lancer, DELAI_APRES_ENREGISTREMENT_MS);
      }
    });
    const surVisibilite = () => {
      if (document.visibilityState === "visible") lancer();
    };
    const intervalle = setInterval(() => {
      if (document.visibilityState === "visible") lancer();
    }, INTERVALLE_MS);
    globalThis.addEventListener?.("online", lancer);
    globalThis.addEventListener?.("offline", rafraichir);
    document.addEventListener("visibilitychange", surVisibilite);
    lancer();

    return () => {
      vivant = false;
      clearTimeout(minuterie);
      clearInterval(intervalle);
      desabonner();
      globalThis.removeEventListener?.("online", lancer);
      globalThis.removeEventListener?.("offline", rafraichir);
      document.removeEventListener("visibilitychange", surVisibilite);
    };
  }, [moteur]);

  const synchroniser = useCallback(() => lancerRef.current(), []);
  return { ...etat, synchroniser };
}
