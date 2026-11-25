// Bandeaux de l'application installable : nouvelle version disponible (R09) et stockage de l'appareil (R04).
// La nouvelle version n'est jamais imposée : l'utilisateur recharge quand il le décide (ses modifications sont déjà enregistrées).
import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { abonnerEcritures, ecrituresEnEchec, rechargementRisque } from "../sync/etat-ecriture.js";
import { decrireStockage, verifierStockage } from "../sync/stockage-durable.js";
import Encadre from "./Encadre.jsx";

/**
 * @param {{enAttente?: number, durable?: boolean}} props  enAttente : modifications non envoyées ; durable : stockage local
 *   persistant (faux si le navigateur refuse IndexedDB et que l'application garde tout en mémoire).
 */
export default function BandeauApplication({ enAttente = 0, durable = true }) {
  const {
    needRefresh: [nouvelleVersion],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, enregistrement) {
      // Au retour sur l'onglet, on vérifie s'il existe une nouvelle version publiée.
      if (!enregistrement) return;
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") enregistrement.update().catch(() => {});
      });
    },
  });
  const [etatStockage, setEtatStockage] = useState(null);
  const [echecsEcriture, setEchecsEcriture] = useState(ecrituresEnEchec());
  useEffect(() => abonnerEcritures(() => setEchecsEcriture(ecrituresEnEchec())), []);
  const risque = rechargementRisque({ echecsEcriture, durable, enAttente });
  const recharger = () => {
    // Recharger alors qu'une modification n'est pas écrite sur l'appareil la ferait perdre : on demande confirmation.
    if (
      risque &&
      !window.confirm(
        "Certaines modifications ne sont pas encore enregistrées sur cet appareil (espace insuffisant ou stockage temporaire). Recharger maintenant peut les faire perdre. Recharger quand même ?",
      )
    ) {
      return;
    }
    updateServiceWorker(true);
  };

  useEffect(() => {
    let vivant = true;
    verifierStockage().then((etat) => {
      if (vivant) setEtatStockage(etat);
    });
    return () => {
      vivant = false;
    };
  }, []);

  // « Non garanti » est courant dans un navigateur de bureau : on ne le signale que lorsqu'il y a quelque chose à perdre.
  const stockage =
    etatStockage && (etatStockage.alerte === "presque-plein" || (etatStockage.alerte === "non-garanti" && enAttente > 0))
      ? decrireStockage(etatStockage)
      : null;
  if (!nouvelleVersion && !stockage) return null;
  return (
    <div className="liste-encadres" style={{ padding: "12px 24px 0" }}>
      {nouvelleVersion ? (
        <Encadre type={risque ? "alerte" : "info"} titre="Nouvelle version disponible">
          {risque
            ? "Attention : certaines modifications ne sont pas encore enregistrées sur cet appareil ; attendez « Enregistré » avant de recharger. "
            : "Vos modifications sont enregistrées sur cet appareil. "}
          <button type="button" className="bouton bouton--secondaire" onClick={recharger}>
            Recharger
          </button>
        </Encadre>
      ) : null}
      {stockage ? <Encadre titre={stockage.titre}>{stockage.message}</Encadre> : null}
    </div>
  );
}
