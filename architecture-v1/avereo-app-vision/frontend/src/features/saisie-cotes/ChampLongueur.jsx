// Champ de longueur en mètres : valide à la sortie du champ ou à Entrée, message d'erreur en toutes lettres.
import { useState } from "react";
import { analyserLongueur, texteDepuisMm } from "../../domain/unites.js";
import Champ from "./Champ.jsx";

/** @param {{libelle: string, valeurMm: number, onValider: (mm: number) => void, autoriserZero?: boolean}} props */
export default function ChampLongueur({ libelle, valeurMm, onValider, autoriserZero = false }) {
  const [texte, setTexte] = useState(texteDepuisMm(valeurMm));
  const [erreur, setErreur] = useState();
  const [precedent, setPrecedent] = useState(valeurMm);
  if (precedent !== valeurMm) {
    setPrecedent(valeurMm);
    setTexte(texteDepuisMm(valeurMm));
    setErreur(undefined);
  }

  function appliquer() {
    const lecture = analyserLongueur(texte, "m", { autoriserZero });
    if (!lecture.ok) {
      setErreur(lecture.message);
      return;
    }
    setErreur(undefined);
    if (lecture.mm !== valeurMm) onValider(lecture.mm);
  }

  return (
    <Champ
      libelle={libelle}
      valeur={texte}
      onChange={setTexte}
      onBlur={appliquer}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          appliquer();
        }
      }}
      erreur={erreur}
    />
  );
}
