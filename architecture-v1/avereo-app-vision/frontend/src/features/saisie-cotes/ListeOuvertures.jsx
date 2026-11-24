// Portes et fenêtres : ajout avec dimensions par défaut, puis réglage de la position et des dimensions (R23, R33).
import { useState } from "react";
import Encadre from "../../components/Encadre.jsx";
import Icone from "../../components/Icone.jsx";
import { ajouterOuverture, creerOuverture, modifierOuverture, supprimerOuverture, trouverPositionLibre, validerOuverture } from "../../domain/modele.js";
import { analyserLongueur, texteDepuisMm } from "../../domain/unites.js";
import Champ from "./Champ.jsx";
import ChampLongueur from "./ChampLongueur.jsx";

const NOMS_TYPE = { porte: "Porte", fenetre: "Fenêtre" };

/** @param {{piece: any, onChange: (piece: any) => void}} props */
export default function ListeOuvertures({ piece, onChange }) {
  const [type, setType] = useState("porte");
  const [mur, setMur] = useState(1);
  // Dimensions de la future ouverture : modifiables avant l'ajout (un mur court n'accueille pas la porte par défaut de 0,90 m).
  const [largeur, setLargeur] = useState(texteDepuisMm(creerOuverture({ type: "porte", murIndex: 0, positionMm: 0 }).largeurMm));
  const [hauteur, setHauteur] = useState(texteDepuisMm(creerOuverture({ type: "porte", murIndex: 0, positionMm: 0 }).hauteurMm));
  const [erreurs, setErreurs] = useState({});
  const [refus, setRefus] = useState(null);
  // Le mur affiché est toujours un mur qui existe : si la pièce change ou perd des murs, on revient au dernier mur.
  const murChoisi = Math.min(Math.max(mur, 1), piece.sommets.length);

  function changerType(nouveauType) {
    setType(nouveauType);
    const defauts = creerOuverture({ type: nouveauType, murIndex: 0, positionMm: 0 });
    setLargeur(texteDepuisMm(defauts.largeurMm));
    setHauteur(texteDepuisMm(defauts.hauteurMm));
    setErreurs({});
  }

  function ajouter() {
    const l = analyserLongueur(largeur, "m");
    const h = analyserLongueur(hauteur, "m");
    setErreurs({ largeur: l.ok ? undefined : l.message, hauteur: h.ok ? undefined : h.message });
    if (!l.ok || !h.ok) return;
    const modele = creerOuverture({ type, murIndex: murChoisi - 1, positionMm: 500, largeurMm: l.mm, hauteurMm: h.mm });
    const position = trouverPositionLibre(piece, modele);
    if (position === null) {
      setRefus(
        validerOuverture(piece, { ...modele, positionMm: 0 }) ??
          "Pas de place sur ce mur pour cette ouverture : réduisez sa largeur, choisissez un autre mur ou déplacez les ouvertures existantes.",
      );
      return;
    }
    setRefus(null);
    onChange(ajouterOuverture(piece, { ...modele, positionMm: position }));
  }

  // Un réglage qui ferait dépasser l'ouverture du mur ou du plafond, ou la superposerait à une autre, est refusé avec un message.
  const verifierChangement = (o, changement) => (mm) => validerOuverture(piece, { ...o, [changement]: mm });

  return (
    <>
      <div className="grille-champs" style={{ alignItems: "end" }}>
        <div className="champ">
          <label className="champ__libelle" htmlFor="type-ouverture">Type</label>
          <select id="type-ouverture" className="champ__saisie" value={type} onChange={(e) => changerType(e.target.value)}>
            <option value="porte">Porte</option>
            <option value="fenetre">Fenêtre</option>
          </select>
        </div>
        <div className="champ">
          <label className="champ__libelle" htmlFor="mur-ouverture">Sur le mur</label>
          <select id="mur-ouverture" className="champ__saisie" value={murChoisi} onChange={(e) => setMur(Number(e.target.value))}>
            {piece.sommets.map((_, i) => (
              <option key={i} value={i + 1}>Mur {i + 1}</option>
            ))}
          </select>
        </div>
        <Champ libelle="Largeur (m)" valeur={largeur} onChange={setLargeur} erreur={erreurs.largeur} />
        <Champ libelle="Hauteur (m)" valeur={hauteur} onChange={setHauteur} erreur={erreurs.hauteur} />
      </div>
      <button type="button" className="bouton bouton--secondaire" onClick={ajouter} style={{ marginBottom: 12 }}>
        <Icone nom="plus" /> Ajouter l'ouverture
      </button>
      {refus ? (
        <div style={{ marginBottom: 12 }}>
          <Encadre type="alerte" titre="Ouverture non ajoutée">
            {refus}
          </Encadre>
        </div>
      ) : null}

      {piece.ouvertures.length === 0 ? (
        <p className="champ__aide">Aucune ouverture. Ajoutez une porte ou une fenêtre sur un mur.</p>
      ) : (
        <ul className="liste" aria-label="Ouvertures de la pièce">
          {piece.ouvertures.map((o) => (
            <li key={o.id} className="carte" style={{ boxShadow: "none", border: "1px solid var(--gris-mineral)" }}>
              <div className="liste__element" style={{ justifyContent: "space-between", marginBottom: 8 }}>
                <span className="pastille">
                  {NOMS_TYPE[o.type]} — mur {o.murIndex + 1}
                </span>
                <button
                  type="button"
                  className="bouton bouton--secondaire"
                  aria-label={`Supprimer ${NOMS_TYPE[o.type].toLowerCase()} du mur ${o.murIndex + 1}`}
                  onClick={() => onChange(supprimerOuverture(piece, o.id))}
                >
                  <Icone nom="supprimer" />
                </button>
              </div>
              <div className="grille-champs">
                <ChampLongueur libelle="Position (m)" valeurMm={o.positionMm} autoriserZero verifier={verifierChangement(o, "positionMm")} onValider={(v) => onChange(modifierOuverture(piece, o.id, { positionMm: v }))} />
                <ChampLongueur libelle="Largeur (m)" valeurMm={o.largeurMm} verifier={verifierChangement(o, "largeurMm")} onValider={(v) => onChange(modifierOuverture(piece, o.id, { largeurMm: v }))} />
                <ChampLongueur libelle="Hauteur (m)" valeurMm={o.hauteurMm} verifier={verifierChangement(o, "hauteurMm")} onValider={(v) => onChange(modifierOuverture(piece, o.id, { hauteurMm: v }))} />
              </div>
              <ChampLongueur libelle="Allège : hauteur du bas (m)" valeurMm={o.alleMm} autoriserZero verifier={verifierChangement(o, "alleMm")} onValider={(v) => onChange(modifierOuverture(piece, o.id, { alleMm: v }))} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
