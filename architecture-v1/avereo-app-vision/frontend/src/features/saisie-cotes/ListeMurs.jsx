// Cotes des murs : chaque longueur se saisit directement (alternative accessible au glissement sur le plan).
import { useEffect, useState } from "react";
import { definirLongueurMur, longueurMur } from "../../domain/modele.js";
import { analyserLongueur, texteDepuisMm } from "../../domain/unites.js";
import Champ from "./Champ.jsx";

function ChampMur({ piece, index, onChange }) {
  const [texte, setTexte] = useState(texteDepuisMm(longueurMur(piece, index)));
  const [erreur, setErreur] = useState();
  const longueurActuelle = Math.round(longueurMur(piece, index));

  // Resynchronise le champ quand la longueur change depuis le plan (glissement d'un sommet).
  useEffect(() => {
    setTexte(texteDepuisMm(longueurActuelle));
    setErreur(undefined);
  }, [longueurActuelle]);

  function appliquer() {
    const lecture = analyserLongueur(texte, "m");
    if (!lecture.ok) {
      setErreur(lecture.message);
      return;
    }
    if (lecture.mm === longueurActuelle) {
      setErreur(undefined);
      return;
    }
    const resultat = definirLongueurMur(piece, index, lecture.mm);
    if (!resultat.ok) {
      setErreur(resultat.message);
      return;
    }
    setErreur(undefined);
    onChange(resultat.piece);
  }

  return (
    <li className="liste__element">
      <Champ
        libelle={`Mur ${index + 1} (m)`}
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
    </li>
  );
}

/** @param {{piece: any, onChange: (piece: any) => void}} props */
export default function ListeMurs({ piece, onChange }) {
  return (
    <ul className="liste" aria-label="Longueur des murs">
      {piece.sommets.map((_, index) => (
        <ChampMur key={`${piece.id}-${index}-${piece.sommets.length}`} piece={piece} index={index} onChange={onChange} />
      ))}
    </ul>
  );
}
