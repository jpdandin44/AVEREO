// Bandeaux de l'application installable : nouvelle version disponible (R09) et stockage de l'appareil (R04).
// La nouvelle version n'est jamais imposée : l'utilisateur recharge quand il le décide (ses modifications sont déjà enregistrées).
import { useEffect, useState } from "react";
import { useRegisterSW } from "virtual:pwa-register/react";
import { decrireStockage, verifierStockage } from "../sync/stockage-durable.js";
import Encadre from "./Encadre.jsx";

export default function BandeauApplication() {
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
  const [stockage, setStockage] = useState(null);

  useEffect(() => {
    let vivant = true;
    verifierStockage().then((etat) => {
      if (vivant) setStockage(decrireStockage(etat));
    });
    return () => {
      vivant = false;
    };
  }, []);

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
