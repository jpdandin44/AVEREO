// Portes et fenêtres : ajout avec dimensions par défaut, puis réglage de la position et des dimensions (R23, R33).
import { useState } from "react";
import Icone from "../../components/Icone.jsx";
import { ajouterOuverture, creerOuverture, modifierOuverture, nombreMurs, supprimerOuverture } from "../../domain/modele.js";
import ChampLongueur from "./ChampLongueur.jsx";

const NOMS_TYPE = { porte: "Porte", fenetre: "Fenêtre" };

/** @param {{piece: any, onChange: (piece: any) => void}} props */
export default function ListeOuvertures({ piece, onChange }) {
  const [type, setType] = useState("porte");
  const [mur, setMur] = useState(1);
  const murs = nombreMurs(piece);

  function ajouter() {
    const murIndex = Math.min(Math.max(mur, 1), murs) - 1;
    onChange(ajouterOuverture(piece, creerOuverture({ type, murIndex, positionMm: 500 })));
  }

  return (
    <>
      <div className="grille-champs" style={{ alignItems: "end" }}>
        <div className="champ">
          <label className="champ__libelle" htmlFor="type-ouverture">Type</label>
          <select id="type-ouverture" className="champ__saisie" value={type} onChange={(e) => setType(e.target.value)}>
            <option value="porte">Porte</option>
            <option value="fenetre">Fenêtre</option>
          </select>
        </div>
        <div className="champ">
          <label className="champ__libelle" htmlFor="mur-ouverture">Sur le mur</label>
          <select id="mur-ouverture" className="champ__saisie" value={mur} onChange={(e) => setMur(Number(e.target.value))}>
            {piece.sommets.map((_, i) => (
              <option key={i} value={i + 1}>Mur {i + 1}</option>
            ))}
          </select>
        </div>
        <button type="button" className="bouton bouton--secondaire" onClick={ajouter} style={{ marginBottom: 12 }}>
          <Icone nom="plus" /> Ajouter
        </button>
      </div>

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
                <ChampLongueur libelle="Position (m)" valeurMm={o.positionMm} autoriserZero onValider={(v) => onChange(modifierOuverture(piece, o.id, { positionMm: v }))} />
                <ChampLongueur libelle="Largeur (m)" valeurMm={o.largeurMm} onValider={(v) => onChange(modifierOuverture(piece, o.id, { largeurMm: v }))} />
                <ChampLongueur libelle="Hauteur (m)" valeurMm={o.hauteurMm} onValider={(v) => onChange(modifierOuverture(piece, o.id, { hauteurMm: v }))} />
              </div>
              <ChampLongueur libelle="Allège : hauteur du bas (m)" valeurMm={o.alleMm} autoriserZero onValider={(v) => onChange(modifierOuverture(piece, o.id, { alleMm: v }))} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
