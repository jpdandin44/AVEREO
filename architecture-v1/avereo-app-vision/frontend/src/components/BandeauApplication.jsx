// Bandeaux de l'application installable : nouvelle version disponible (R09) et stockage de l'appareil (R04).
// La nouvelle version n'est jamais imposée : l'utilisateur recharge quand il le décide (ses modifications sont déjà enregistrées).
import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { decrireStockage, verifierStockage } from "../sync/stockage-durable.js";
import Encadre from "./Encadre.jsx";

/** @param {{enAttente?: number}} props  modifications non envoyées : l'alerte « stockage non garanti » n'apparaît que s'il y en a. */
export default function BandeauApplication({ enAttente = 0 }) {
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
        <Encadre titre="Nouvelle version disponible">
          Vos modifications sont enregistrées sur cet appareil.{" "}
          <button type="button" className="bouton bouton--secondaire" onClick={() => updateServiceWorker(true)}>
            Recharger
          </button>
        </Encadre>
      ) : null}
      {stockage ? <Encadre titre={stockage.titre}>{stockage.message}</Encadre> : null}
    </div>
  );
}
