import { useState } from "react";
import ChampLongueur from "../saisie-cotes/ChampLongueur.jsx";
import Encadre from "../../components/Encadre.jsx";
import { evaluerCotesLaser } from "../../domain/terrain.js";
import { texteDepuisMm } from "../../domain/unites.js";

function Cote({ nom, piece, onChange }) {
  const cote = piece.cotesLaser?.[nom];
  const [repere, setRepere] = useState(cote ?? (nom === "controle" ? { type: "hauteur" } : { murIndex: nom === "largeur" ? 1 : 0 }));
  const courant = cote ?? repere;
  const resultat = evaluerCotesLaser(piece).find(c => c.nom === nom);
  function appliquer(changement) {
    const nouvelle = { ...courant, ...changement };
    setRepere(nouvelle);
    if (nouvelle.valeurMm) onChange({ ...piece, cotesLaser: { ...piece.cotesLaser, [nom]: nouvelle } });
  }
  const sommets = (valeur, action, libelle, exclu) => <label className="champ">{libelle}<select className="champ__saisie" value={valeur} onChange={e => action(Number(e.target.value))}>
    {piece.sommets.map((_, i) => <option key={i} value={i} disabled={i === exclu}>{nom === "controle" ? "Sommet" : "Mur"} {i + 1}</option>)}
  </select></label>;
  return <fieldset className="terrain-cote"><legend>{ { longueur: "Longueur", largeur: "Largeur", controle: "Contrôle" }[nom]}</legend>
    {nom !== "controle" ? sommets(courant.murIndex, murIndex => appliquer({ murIndex }), "Mur mesuré") : <>
      <label className="champ">Type de contrôle<select className="champ__saisie" value={courant.type} onChange={e => {
        const nouvelle = e.target.value === "hauteur" ? { type: "hauteur" } : { type: "diagonale", deSommet: 0, aSommet: 2 };
        setRepere(nouvelle);
        if (cote) onChange({ ...piece, cotesLaser: { ...piece.cotesLaser, controle: { ...nouvelle, valeurMm: cote.valeurMm } } });
      }}><option value="hauteur">Hauteur</option><option value="diagonale">Diagonale</option></select></label>
      {courant.type === "diagonale" && <>{sommets(courant.deSommet, deSommet => appliquer({ deSommet }), "Du sommet", courant.aSommet)}{sommets(courant.aSommet, aSommet => appliquer({ aSommet }), "Au sommet", courant.deSommet)}</>}
    </>}
    <ChampLongueur libelle="Valeur mesurée (m)" valeurMm={cote?.valeurMm ?? 0} onValider={valeurMm => appliquer({ valeurMm })} />
    {resultat && <Encadre type={resultat.etat === "ok" ? "info" : "alerte"} titre={resultat.etat === "ok" ? "OK" : "Hors tolérance"}>
      <span className="mono">Plan : {texteDepuisMm(resultat.modeleMm)} m ; mesurée : {texteDepuisMm(resultat.valeurMm)} m ; écart : {resultat.ecartMm} mm.</span> {resultat.libelle}
    </Encadre>}
    <button className="bouton bouton--secondaire" type="button" disabled={!cote} onClick={() => {
      const cotesLaser = { ...piece.cotesLaser }; delete cotesLaser[nom];
      const { valeurMm, ...sansValeur } = courant; setRepere(sansValeur);
      onChange({ ...piece, cotesLaser });
    }}>Effacer la cote</button>
  </fieldset>;
}

export default function CotesLaser(props) {
  return <div className="terrain"><h3>Cotes laser</h3>{["longueur", "largeur", "controle"].map(nom => <Cote key={`${props.piece.id}-${props.piece.sommets.length}-${nom}`} nom={nom} {...props} />)}</div>;
}
