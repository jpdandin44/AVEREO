import { useStore } from '../hooks/useStore.js';
import { citeMarkdown, citeShort } from '../services/citations.js';
import { provenanceChain } from '../services/resource.js';
import { copyText } from '../utils/browser.js';
import { fmtDate } from '../utils/text.js';
import { ResourceBadges } from './Badges.jsx';
import Highlight from './Highlight.jsx';

export default function ResultCard({ r, terms, relevance, query, onEdit }) {
  const inBasket = useStore(s => s.basket.includes(r.id));
  const { toggleBasket, showToast, logCopy, logNotUseful, requestReview } = useStore.getState();

  const copy = async (text, label) => {
    const ok = await copyText(text);
    if (ok) logCopy(r.id);
    showToast(ok ? label : 'Copie refusée par le navigateur : sélectionnez le texte à la main.');
  };
  // L'organisme est déjà affiché en tête : ne pas le répéter dans la chaîne
  const chain = provenanceChain(r).filter(c => c !== r.src.org);
  const canRequest = r.client === 'INTERNAL_ONLY' || r.client === 'NOT_EVALUATED';

  return (
    <article className="res">
      <div className="res-head">
        <div>
          <div className="kind">{r.type} · {r.domain}</div>
          <h3><Highlight text={r.title} terms={terms} /></h3>
        </div>
        <div className="score" title="Pertinence">
          {relevance != null && <span className="bar"><i style={{ width: `${Math.max(6, Math.round(relevance * 100))}%` }} /></span>}
          <span>{r.id}</span>
        </div>
      </div>
      {r.text && <p className="excerpt"><Highlight text={r.text} terms={terms} /></p>}
      <div className="prov">
        {r.src.org && <strong>{r.src.org}</strong>}
        {chain.map((c, i) => <span key={i}><span className="sep">›</span> {c}</span>)}
        {r.src.loc && <><span className="sep">·</span><strong>{r.src.loc}</strong></>}
        <span className="sep">·</span><span>ajouté le {fmtDate(r.date)}</span>
      </div>
      <ResourceBadges r={r} />
      {r.conflict && <div className="conflict">{r.conflict}</div>}
      <div className="actions">
        <button className="btn primary" onClick={() => copy(citeShort(r), 'Citation copiée')}>Copier la citation</button>
        <button className="btn" onClick={() => copy(citeMarkdown(r), 'Extrait et source copiés')}>Copier extrait + source</button>
        <button className="btn" aria-pressed={inBasket} onClick={() => { toggleBasket(r.id); showToast(inBasket ? 'Retiré du panier' : 'Ajouté au panier'); }}>
          {inBasket ? 'Retirer du panier' : 'Ajouter au panier'}
        </button>
        {r.src.url && <a className="btn" href={r.src.url} target="_blank" rel="noopener noreferrer">Ouvrir la source ↗</a>}
        <span className="actions-sep" />
        {canRequest && <button className="btn ghost" onClick={() => { requestReview(r.id); showToast('Ajouté à la liste « À valider »'); }}>Demander la validation client</button>}
        <button className="btn ghost" onClick={() => onEdit(r.id)}>Modifier</button>
        {query && <button className="btn ghost" onClick={() => { logNotUseful(r.id, query); showToast('Merci : noté comme « pas utile » pour cette recherche'); }}>Pas utile</button>}
      </div>
    </article>
  );
}
