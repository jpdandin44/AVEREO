// Saisie rapide d'une pièce rectangulaire : quatre champs seulement (nom, longueur, largeur, hauteur) — R23.
import { useState } from "react";
import { analyserLongueur } from "../../domain/unites.js";
import Champ from "./Champ.jsx";

/** @param {{onCreer: (donnees: {nom: string, longueurMm: number, largeurMm: number, hauteurMm: number}) => void}} props */
export default function FormulairePiece({ onCreer }) {
  const [nom, setNom] = useState("");
  const [longueur, setLongueur] = useState("4,00");
  const [largeur, setLargeur] = useState("3,00");
  const [hauteur, setHauteur] = useState("2,50");
  const [erreurs, setErreurs] = useState({});

  function creer(evenement) {
    evenement.preventDefault();
    const l = analyserLongueur(longueur, "m");
    const w = analyserLongueur(largeur, "m");
    const h = analyserLongueur(hauteur, "m");
    const nouvellesErreurs = {
      longueur: l.ok ? undefined : l.message,
      largeur: w.ok ? undefined : w.message,
      hauteur: h.ok ? undefined : h.message,
    };
    setErreurs(nouvellesErreurs);
    if (!l.ok || !w.ok || !h.ok) return;
    onCreer({ nom, longueurMm: l.mm, largeurMm: w.mm, hauteurMm: h.mm });
    setNom("");
  }

  return (
    <form onSubmit={creer} noValidate aria-label="Nouvelle pièce rectangulaire">
      <Champ libelle="Nom de la pièce" valeur={nom} onChange={setNom} inputMode="text" aide="Facultatif" />
      <div className="grille-champs">
        <Champ libelle="Longueur (m)" valeur={longueur} onChange={setLongueur} erreur={erreurs.longueur} />
        <Champ libelle="Largeur (m)" valeur={largeur} onChange={setLargeur} erreur={erreurs.largeur} />
        <Champ libelle="Hauteur (m)" valeur={hauteur} onChange={setHauteur} erreur={erreurs.hauteur} />
      </div>
      <button type="submit" className="bouton bouton--accent">
        Créer la pièce
      </button>
    </form>
  );
}
