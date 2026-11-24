// Écran du relevé : liste des pièces et saisie à gauche, plan 2D au centre, métrés à droite.
// Un seul modèle alimente les trois zones : tout se met à jour en direct (R27).
import { useState } from "react";
import Encadre from "../../components/Encadre.jsx";
import Icone from "../../components/Icone.jsx";
import { HAUTEUR_PAR_DEFAUT_MM, definirHauteur, renommerPiece } from "../../domain/modele.js";
import ChampLongueur from "../saisie-cotes/ChampLongueur.jsx";
import Champ from "../saisie-cotes/Champ.jsx";
import FormulairePiece from "../saisie-cotes/FormulairePiece.jsx";
import ListeMurs from "../saisie-cotes/ListeMurs.jsx";
import ListeOuvertures from "../saisie-cotes/ListeOuvertures.jsx";
import PanneauMetres from "../metres-panneau/PanneauMetres.jsx";
import PanneauPrecision from "../metres-panneau/PanneauPrecision.jsx";
import Plan2D from "../plan2d/Plan2D.jsx";
import { useReleve } from "./useReleve.js";

function NomPiece({ piece, onChange }) {
  const [texte, setTexte] = useState(piece.nom);
  const [precedent, setPrecedent] = useState(piece.nom);
  if (precedent !== piece.nom) {
    setPrecedent(piece.nom);
    setTexte(piece.nom);
  }
  const appliquer = () => {
    const propre = texte.trim() || piece.nom;
    setTexte(propre);
    if (propre !== piece.nom) onChange(renommerPiece(piece, propre));
  };
  return (
    <Champ
      libelle="Nom de la pièce"
      valeur={texte}
      onChange={setTexte}
      onBlur={appliquer}
      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), appliquer())}
      inputMode="text"
    />
  );
}

/** @param {{projet?: {id: string, name: string}}} props */
export default function EcranReleve({ projet }) {
  const releve = useReleve();
  const { niveau, piece } = releve;

  return (
    <>
      <main className="contenu">
        {projet ? (
          <div style={{ gridColumn: "1 / -1" }}>
            <Encadre titre={`Projet : ${projet.name}`}>
              Le plan et les métrés de ce relevé ne sont pas encore enregistrés sur le serveur : ils seront conservés automatiquement au prochain lot. Vous pouvez revenir à la liste des projets sans rien perdre, mais ne fermez ni n'actualisez la page avant d'avoir noté vos mesures.
            </Encadre>
          </div>
        ) : null}
        <div className="colonne">
          <section className="carte" aria-labelledby="titre-pieces">
            <h2 id="titre-pieces">Niveaux et pièces</h2>
            <div className="champ">
              <label className="champ__libelle" htmlFor="choix-niveau">
                Niveau
              </label>
              <select
                id="choix-niveau"
                className="champ__saisie"
                value={niveau.id}
                onChange={(e) => releve.choisirNiveau(e.target.value)}
              >
                {releve.batiment.niveaux.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.nom}
                  </option>
                ))}
              </select>
            </div>
            <div className="barre-boutons" style={{ marginBottom: 12 }}>
              <button type="button" className="bouton bouton--secondaire" onClick={releve.creerNouveauNiveau}>
                <Icone nom="plus" /> Ajouter un niveau
              </button>
            </div>
            {niveau.pieces.length === 0 ? (
              <Encadre titre="Aucune pièce sur ce niveau">Créez une pièce ci-dessous ou tracez-la sur le plan.</Encadre>
            ) : (
              <ul className="liste" aria-label="Pièces du niveau">
                {niveau.pieces.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      className={p.id === piece?.id ? "bouton" : "bouton bouton--secondaire"}
                      style={{ width: "100%", justifyContent: "flex-start" }}
                      aria-pressed={p.id === piece?.id}
                      onClick={() => releve.choisirPiece(p.id)}
                    >
                      {p.nom}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="carte" aria-labelledby="titre-nouvelle">
            <h2 id="titre-nouvelle">Nouvelle pièce rectangulaire</h2>
            <FormulairePiece onCreer={releve.creerPieceRect} />
          </section>

          {piece ? (
            <section className="carte" aria-labelledby="titre-piece">
              <h2 id="titre-piece">Pièce sélectionnée</h2>
              <NomPiece piece={piece} onChange={releve.validerPiece} />
              <ChampLongueur
                libelle="Hauteur sous plafond (m)"
                valeurMm={piece.hauteurMm}
                onValider={(mm) => releve.validerPiece(definirHauteur(piece, mm))}
              />
              <h3 style={{ margin: "16px 0 8px" }}>Murs</h3>
              <ListeMurs piece={piece} onChange={releve.validerPiece} />
              <h3 style={{ margin: "16px 0 8px" }}>Ouvertures</h3>
              <ListeOuvertures piece={piece} onChange={releve.validerPiece} />
              <div className="barre-boutons" style={{ marginTop: 16 }}>
                <button type="button" className="bouton bouton--secondaire" onClick={releve.supprimerPieceCourante}>
                  <Icone nom="supprimer" /> Supprimer la pièce
                </button>
              </div>
            </section>
          ) : null}
        </div>

        <div className="colonne">
          <Plan2D
            niveau={niveau}
            pieceId={piece?.id ?? null}
            hauteurDefautMm={HAUTEUR_PAR_DEFAUT_MM}
            peutAnnuler={releve.peutAnnuler}
            peutRetablir={releve.peutRetablir}
            onAnnuler={releve.annuler}
            onRetablir={releve.retablir}
            onChoisir={releve.choisirPiece}
            onApercu={releve.previsualiserPiece}
            onValider={releve.validerPiece}
            onCreerDepuisSommets={(sommets) => releve.creerPieceDepuisSommets(sommets, HAUTEUR_PAR_DEFAUT_MM)}
          />
        </div>

        <div className="colonne">
          <PanneauMetres
            nomPiece={piece?.nom}
            metres={releve.metresPiece}
            nomNiveau={niveau.nom}
            metresNiveau={releve.metresNiveau}
          />
          <PanneauPrecision />
        </div>
      </main>
    </>
  );
}
