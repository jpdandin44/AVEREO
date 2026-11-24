// Crée le moteur de synchronisation d'un compte : base Dexie cloisonnée par identité, ou mémoire si IndexedDB est indisponible.
import { useEffect, useState } from "react";
import { creerMoteur, obtenirDeviceId } from "./moteur.js";
import { creerStockageDexie, nomBase } from "./stockage-dexie.js";
import { creerStockageMemoire } from "./stockage-memoire.js";

/**
 * @param {ReturnType<import("../services/api.js").creerClient>} client
 * @param {{provider: string, id: string}|null} identite
 * @returns {{moteur: ReturnType<typeof creerMoteur>, durable: boolean}|null}
 */
export function useMoteur(client, identite) {
  const [pret, setPret] = useState(null);
  const provider = identite?.provider;
  const id = identite?.id;

  useEffect(() => {
    if (!provider || !id) {
      setPret(null);
      return undefined;
    }
    let annule = false;
    let stockage = null;
    (async () => {
      let durable = true;
      try {
        stockage = creerStockageDexie({ nom: nomBase({ provider, id }) });
        await stockage.lireMeta("device_id"); // ouvre la base : échoue ici si IndexedDB est refusé
      } catch {
        stockage?.fermer?.();
        stockage = creerStockageMemoire();
        durable = false;
      }
      const deviceId = await obtenirDeviceId(stockage);
      if (annule) {
        stockage.fermer?.();
        return;
      }
      setPret({ moteur: creerMoteur({ stockage, api: client, deviceId }), durable });
    })();
    return () => {
      annule = true;
      setPret(null);
      stockage?.fermer?.();
    };
  }, [client, provider, id]);

  return pret;
}
