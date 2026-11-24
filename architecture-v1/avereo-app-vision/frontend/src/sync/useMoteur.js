// Crée le moteur de synchronisation d'un compte : base Dexie cloisonnée par identité, ou mémoire si IndexedDB est indisponible.
// Le client d'API est lié au compte (en-tête d'identité attendue) : si la session devient celle d'un autre compte, le serveur refuse.
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
    let moteur = null;
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
      if (annule) return;
      moteur = creerMoteur({ stockage, api: client.pour({ provider, id }), deviceId, nomCanal: nomBase({ provider, id }) });
      setPret({ moteur, durable });
    })().catch(() => {
      // Le composant a été démonté (ou le mode strict de React a rejoué l'effet) pendant l'ouverture de la base : rien à signaler.
      if (!annule) setPret(null);
    });
    return () => {
      annule = true;
      moteur?.fermer();
      stockage?.fermer?.();
      setPret(null);
    };
  }, [client, provider, id]);

  return pret;
}
