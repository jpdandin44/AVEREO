// Bouton « Dicter » à côté d'un champ libre : place le curseur à la fin du champ (le clavier du téléphone s'ouvre)
// et indique le geste de dictée du système. Aucune reconnaissance vocale n'est lancée par Vision.
import { useState } from "react";
import Icone from "./Icone.jsx";
import { conseilDicteeCourant } from "./dictee.js";

/** @param {{cibleId: string}} props identifiant du champ (input ou textarea) à remplir */
export default function BoutonDictee({ cibleId }) {
  const [conseil, setConseil] = useState(null);
  function activer() {
    const champ = document.getElementById(cibleId);
    if (champ) {
      champ.focus();
      const fin = champ.value?.length ?? 0;
      try {
        champ.setSelectionRange(fin, fin);
      } catch {
        /* type de champ sans sélection : sans effet */
      }
    }
    setConseil(conseilDicteeCourant());
  }
  return (
    <span className="dictee">
      <button type="button" className="bouton bouton--secondaire dictee__bouton" aria-controls={cibleId} onClick={activer}>
        <Icone nom="micro" />
        Dicter
      </button>
      <span className="champ__aide" aria-live="polite">{conseil}</span>
    </span>
  );
}
