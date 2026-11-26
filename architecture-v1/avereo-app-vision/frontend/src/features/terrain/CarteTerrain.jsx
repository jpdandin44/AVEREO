import { useRef, useState } from "react";
import Dialogue from "./Dialogue.jsx";
import Encadre from "../../components/Encadre.jsx";
import Icone from "../../components/Icone.jsx";
import { cibleCommentaire, enregistrerCommentaire, commentaireHorsMur } from "./logique.js";
import { positionCommentaire } from "../../domain/terrain.js";

export default function CarteTerrain({ niveau, piece, photos, selection, onSelection, validerNiveau, onSupprimer }) {
  const camera = useRef(null), fichiers = useRef(null);
  const [texte, setTexte] = useState(""), [attache, setAttache] = useState("point"), [edition, setEdition] = useState(null), [erreur, setErreur] = useState(null);
  const photo = (niveau.photos ?? []).find(p => selection?.type === "photo" && p.id === selection.id);
  const commentaire = (niveau.commentaires ?? []).find(c => selection?.type === "commentaire" && c.id === selection.id);
  function enregistrer(e) {
    e.preventDefault();
    try {
      const c = { id: edition?.id ?? crypto.randomUUID(), texte: texte.trim(), cible: edition?.cible ?? cibleCommentaire(niveau, piece, photo, attache) };
      const suivant = enregistrerCommentaire(niveau, c);
      validerNiveau(suivant); setTexte(""); setEdition(null); setErreur(null);
    } catch (e) { setErreur(e.message); }
  }
  const alt = p => p.legende || `Photo du ${new Date(p.prisLe).toLocaleString("fr-FR")}`;
  const image = p => photos.images[p.id]?.url ? <img className="terrain-miniature" src={photos.images[p.id].url} alt={alt(p)} /> : <span>{photos.images[p.id]?.message ?? "Chargement de la photo…"}</span>;
  return <section className="carte terrain" aria-labelledby="titre-terrain">
    <h2 id="titre-terrain">Photos et commentaires</h2>
    <input ref={camera} hidden type="file" accept="image/*" capture="environment" onChange={e => { photos.ajouter(e.target.files[0]); e.target.value = ""; }} />
    <input ref={fichiers} hidden type="file" accept="image/*" onChange={e => { photos.ajouter(e.target.files[0]); e.target.value = ""; }} />
    <button type="button" className="bouton" disabled={photos.occupe} onClick={() => camera.current.click()}>Prendre une photo</button>
    <button type="button" className="bouton bouton--secondaire" disabled={photos.occupe} onClick={() => fichiers.current.click()}>Choisir une photo</button>
    {photos.occupe && <p role="status">Compression et enregistrement de la photo…</p>}
    {photos.erreur && <Encadre type="alerte" titre="Photo">{photos.erreur}</Encadre>}
    <ul className="liste" aria-label="Photos du niveau">{(niveau.photos ?? []).map(p => {
      const media = photos.medias.find(m => m.id === p.id);
      const etat = media?.erreur ? ["alerte", "erreur d'envoi"] : media?.etat === "a-envoyer" ? ["attente", "en attente d'envoi"] : ["valide", "envoyée"];
      return <li key={p.id} className="terrain-element">
        <button type="button" className="bouton bouton--secondaire terrain-photo" onClick={() => onSelection({ type: "photo", id: p.id })}>{image(p)}<span>{alt(p)}</span></button>
        <span>{niveau.pieces.find(piece => piece.id === p.pieceId)?.nom ?? "Niveau"}</span>
        <span className="indicateur"><Icone nom={etat[0]} />{etat[1]}</span>
        <button type="button" className="bouton bouton--secondaire" onClick={() => onSupprimer({ type: "photo", photoId: p.id })}>Supprimer la photo</button>
      </li>;
    })}</ul>
    <h3>{edition ? "Modifier le commentaire" : "Ajouter un commentaire"}</h3>
    <form onSubmit={enregistrer} className="terrain">
      <label className="champ">Commentaire<textarea className="champ__saisie" rows={4} maxLength={500} value={texte} onChange={e => setTexte(e.target.value)} /></label>
      <span className="mono" aria-live="polite">{[...texte].length} / 500 caractères</span>
      {!edition && <label className="champ">Attacher à<select className="champ__saisie" value={attache} onChange={e => setAttache(e.target.value)}>
        <option value="point">Un point du plan</option>
        {piece && <option value="piece">La pièce sélectionnée</option>}
        {piece?.sommets.map((_, i) => <option key={i} value={`mur:${i}`}>Mur {i + 1}</option>)}
        {photo && <option value="photo">La photo sélectionnée</option>}
      </select></label>}
      {erreur && <p role="alert">{erreur}</p>}
      <button className="bouton" type="submit">{edition ? "Valider la modification" : "Ajouter le commentaire"}</button>
      {edition && <button className="bouton bouton--secondaire" type="button" onClick={() => { setEdition(null); setTexte(""); }}>Annuler la modification</button>}
    </form>
    <ul className="liste" aria-label="Commentaires du niveau">{(niveau.commentaires ?? []).map(c => <li key={c.id} className="terrain-element">
      <button type="button" className="bouton bouton--secondaire" onClick={() => onSelection({ type: "commentaire", id: c.id })}>{c.texte}</button>
      {!positionCommentaire(niveau, c) && <span role="status">Cible absente : commentaire sans repère.</span>}
      {commentaireHorsMur(niveau, c) && <span role="status">Le commentaire dépasse le mur raccourci. Sa position est conservée.</span>}
      <span>Attaché à : {c.cible.type === "mur" ? `Mur ${c.cible.murIndex + 1}` : c.cible.type === "piece" ? "Pièce" : c.cible.type === "photo" ? "Photo" : "Point du plan"}</span>
    </li>)}</ul>
    {photo && !selection.fermee && <Dialogue titre={alt(photo)} onFermer={() => onSelection({ ...selection, fermee: true })}>
      {image(photo)}
      <button className="bouton bouton--secondaire" type="button" onClick={() => { setAttache("photo"); onSelection({ ...selection, fermee: true }); }}>Commenter cette photo</button>
    </Dialogue>}
    {commentaire && <Dialogue titre="Commentaire" onFermer={() => onSelection(null)}>
      <p>{commentaire.texte}</p>
      <button type="button" className="bouton" onClick={() => { setEdition(commentaire); setTexte(commentaire.texte); onSelection(null); }}>Modifier</button>
      <button type="button" className="bouton bouton--secondaire" onClick={() => { validerNiveau({ ...niveau, commentaires: niveau.commentaires.filter(c => c.id !== commentaire.id) }); onSelection(null); }}>Supprimer</button>
    </Dialogue>}
  </section>;
}
