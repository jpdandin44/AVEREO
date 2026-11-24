// État de précision de chaque mode de capture (R30). Tout mode qui ne tient pas ±2 cm est signalé comme tel :
// icône et titre en toutes lettres, jamais la couleur seule (R12).
import Encadre from "../../components/Encadre.jsx";
import { MODES, etatPrecision } from "../../domain/precision.js";

const NOMS = {
  [MODES.COTES_SAISIES]: "Cotes saisies au mètre laser",
  [MODES.VIDEO]: "Reconstruction depuis la vidéo",
  [MODES.WEBXR]: "Mesure en réalité augmentée (WebXR)",
};

/** @param {{resultatEssai?: any}} props resultatEssai : résultat du banc d'essai sur la pièce de référence (aucun tant que la pièce n'est pas fournie) */
export default function PanneauPrecision({ resultatEssai }) {
  return (
    <section className="carte" aria-labelledby="titre-precision">
      <h2 id="titre-precision">Précision des modes de mesure</h2>
      <div className="liste-encadres">
        {Object.values(MODES).map((mode) => {
          const etat = etatPrecision(mode, { resultatEssai });
          return (
            <Encadre key={mode} type={etat.icone === "alerte" ? "alerte" : "info"} titre={`${NOMS[mode]} — ${etat.titre}`}>
              {etat.libelle}
            </Encadre>
          );
        })}
      </div>
    </section>
  );
}
