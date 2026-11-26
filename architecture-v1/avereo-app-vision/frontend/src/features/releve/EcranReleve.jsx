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
import StatutSynchro from "./StatutSynchro.jsx";
import { useReleve } from "./useReleve.js";
import CotesLaser from "../terrain/CotesLaser.jsx";
import CarteTerrain from "../terrain/CarteTerrain.jsx";
import Dialogue from "../terrain/Dialogue.jsx";
import { usePhotos } from "../terrain/usePhotos.js";
import { marquerPhotoSupprimee, deplacerRepere } from "../terrain/logique.js";
import { commentairesConcernes, supprimerCible, insererSommetTerrain } from "../../domain/terrain.js";

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

/** @param {{projet: {id: string, name: string}, moteur: ReturnType<import("../../sync/moteur.js").creerMoteur>}} props */
export default function EcranReleve({ projet, moteur }) {
  const releve = useReleve(projet.id, moteur);
  const { niveau, piece } = releve;
  const [selection, setSelection] = useState(null), [suppression, setSuppression] = useState(null);
  const [erreurTerrain, setErreurTerrain] = useState(null), [suppressionEnCours, setSuppressionEnCours] = useState(false);
  const photos = usePhotos({ moteur, projetId: projet.id, niveau, piece, validerNiveau: releve.validerNiveau });
  async function supprimer(cible, choix) {
    setSuppressionEnCours(true);
    try {
      const resultat = supprimerCible(niveau, cible, choix);
      if (!resultat.ok) throw new Error(resultat.message);
      if (cible.type === "photo") {
        await marquerPhotoSupprimee(moteur, projet.id, cible.photoId);
        photos.noterSuppression(cible.photoId);
      }
      if (cible.type === "photo") {
        releve.validerNiveau(n => supprimerCible(n, cible, choix).niveau, niveau.id);
      } else releve.validerNiveau(resultat.niveau);
      setSuppression(null); setSelection(null); setErreurTerrain(null);
    } catch (e) { setErreurTerrain(`Suppression impossible : ${e.message}`); }
    finally { setSuppressionEnCours(false); }
  }
  function demanderSuppression(cible) {
    if (commentairesConcernes(niveau, cible).length) setSuppression(cible);
    else supprimer(cible, "supprimer");
  }
  function inserer(pieceId, murIndex, t) {
    const r = insererSommetTerrain(niveau, pieceId, murIndex, t);
    if (r.ok) { releve.validerNiveau(r.niveau); setErreurTerrain(null); }
    else setErreurTerrain(r.message);
  }

  if (!releve.charge) {
    return (
      <main className="contenu contenu--session">
        <div className="colonne">
          <Encadre titre="Ouverture du relevé">Lecture du relevé enregistré sur cet appareil…</Encadre>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="contenu">
        <div style={{ gridColumn: "1 / -1", display: "flex", flexDirection: "column", gap: 16 }}>
          {releve.echecEnregistrement ? (
            <Encadre type="alerte" titre="Enregistrement sur cet appareil impossible">
              Le relevé n'a pas pu être enregistré (espace de stockage insuffisant ?). Nouvelle tentative en cours : libérez de l'espace sur l'appareil et ne fermez pas la page.
            </Encadre>
          ) : null}
          <StatutSynchro projetId={projet.id} moteur={moteur} />
          {erreurTerrain && <Encadre type="alerte" titre="Action terrain">{erreurTerrain}</Encadre>}
        </div>
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
              <NomPiece key={piece.id} piece={piece} onChange={releve.validerPiece} />
              <CotesLaser piece={piece} onChange={releve.validerPiece} />
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
                <button type="button" className="bouton bouton--secondaire" onClick={() => demanderSuppression({ type: "piece", pieceId: piece.id })}>
                  <Icone nom="supprimer" /> Supprimer la pièce
                </button>
              </div>
            </section>
          ) : null}
          <CarteTerrain key={niveau.id} niveau={niveau} piece={piece} photos={photos} selection={selection} onSelection={setSelection} validerNiveau={releve.validerNiveau} onSupprimer={demanderSuppression} />
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
            onSupprimerSommet={index => demanderSuppression({ type: "sommet", pieceId: piece.id, sommetIndex: index })}
            onInsererSommet={(murIndex, t) => inserer(piece.id, murIndex, t)}
            onSelectionTerrain={setSelection}
            onDeplacerRepere={(type, id, position) => releve.validerNiveau(n => deplacerRepere(n, type, id, position))}
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
      {suppression && <Dialogue titre="Commentaires attachés" sansFermer onFermer={() => !suppressionEnCours && setSuppression(null)}>
        <p>Choisissez le devenir des commentaires avant la suppression.</p>
        <button type="button" className="bouton" disabled={suppressionEnCours} onClick={() => supprimer(suppression, "supprimer")}>{(() => {
          const n = commentairesConcernes(niveau, suppression).length;
          return n === 1 ? "Supprimer aussi le commentaire" : `Supprimer aussi les ${n} commentaires`;
        })()}</button>
        <button type="button" className="bouton bouton--secondaire" disabled={suppressionEnCours} onClick={() => supprimer(suppression, "detacher")}>Les garder sur le plan</button>
        <button type="button" className="bouton bouton--secondaire" disabled={suppressionEnCours} onClick={() => setSuppression(null)}>Annuler</button>
      </Dialogue>}
    </>
  );
}
