// Bandeaux de l'application installable : nouvelle version disponible (R09) et stockage de l'appareil (R04).
// La nouvelle version n'est jamais imposée : l'utilisateur recharge quand il le décide (ses modifications sont déjà enregistrées).
import { useEffect, useRef, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { abonnerEcritures, ecrituresNonPersistees, rechargementRisque } from "../sync/etat-ecriture.js";
import { decrireStockage, verifierStockage } from "../sync/stockage-durable.js";
import Encadre from "./Encadre.jsx";

/**
 * @param {{enAttente?: number, durable?: boolean}} props  enAttente : modifications non envoyées ; durable : stockage local
 *   persistant (faux si le navigateur refuse IndexedDB et que l'application garde tout en mémoire).
 */
export default function BandeauApplication({ enAttente = 0, durable = true }) {
  const contexte = useRef({ enAttente, durable });
  contexte.current = { enAttente, durable };
  const [rechargementBloque, setRechargementBloque] = useState(false);
  const risqueActuel = () =>
    rechargementRisque({ nonPersistees: ecrituresNonPersistees(), durable: contexte.current.durable, enAttente: contexte.current.enAttente });
  const {
    needRefresh: [nouvelleVersion],
    updateServiceWorker,
  } = useRegisterSW({
    // La nouvelle version a pris la main (clic ici ou dans un autre onglet) : on ne recharge que si rien n'est en train de s'écrire.
    onNeedReload() {
      if (risqueActuel()) setRechargementBloque(true);
      else window.location.reload();
    },
    onRegisteredSW(_url, enregistrement) {
      // Au retour sur l'onglet, on vérifie s'il existe une nouvelle version publiée.
      if (!enregistrement) return;
      document.addEventListener("visibilitychange", () => {
        if (document.visibilityState === "visible") enregistrement.update().catch(() => {});
      });
    },
  });
  const [etatStockage, setEtatStockage] = useState(null);
  const [nonPersistees, setNonPersistees] = useState(ecrituresNonPersistees());
  useEffect(() => abonnerEcritures(() => setNonPersistees(ecrituresNonPersistees())), []);
  const risque = rechargementRisque({ nonPersistees, durable, enAttente });
  const recharger = () => {
    // Recharger alors qu'une modification n'est pas écrite sur l'appareil la ferait perdre : on demande confirmation.
    if (
      risqueActuel() &&
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
  if (!nouvelleVersion && !stockage && !rechargementBloque) return null;
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
      {rechargementBloque ? (
        <Encadre type="alerte" titre="Nouvelle version activée dans un autre onglet">
          Cette page garde l'ancienne version tant qu'une modification n'est pas enregistrée sur cet appareil. Attendez « Enregistré », puis{" "}
          <button type="button" className="bouton bouton--secondaire" onClick={recharger}>
            Recharger
          </button>
        </Encadre>
      ) : null}
      {stockage ? <Encadre titre={stockage.titre}>{stockage.message}</Encadre> : null}
    </div>
  );
}
