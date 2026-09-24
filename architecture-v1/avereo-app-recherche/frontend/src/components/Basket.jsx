import { useMemo } from 'react';
import { CITATION_FORMATS } from '../config/referentiels.js';
import { useStore } from '../hooks/useStore.js';
import { exportBasket, referenceOnlyItems } from '../services/citations.js';
import { copyText } from '../utils/browser.js';

export default function Basket() {
  const basket = useStore(s => s.basket);
  const resources = useStore(s => s.resources);
  const format = useStore(s => s.format);
  const { setFormat, toggleBasket, clearBasket, showToast, logCopy } = useStore.getState();

  const items = useMemo(() => basket.map(id => resources.find(r => r.id === id)).filter(Boolean), [basket, resources]);
  const text = useMemo(() => exportBasket(items, format), [items, format]);
  const refOnly = referenceOnlyItems(items, format);
  const groups = [...new Set(CITATION_FORMATS.map(f => f.group))];

  const copyAll = async () => {
    const ok = await copyText(text);
    if (ok) logCopy(items.map(r => r.id));
    showToast(ok ? 'Panier copié' : 'Copie refusée : sélectionnez le texte et faites Ctrl+C');
  };

  return (
    <aside className="basket" aria-label="Panier de citations">
      <h2>Panier de citations <span className="badge b-neutral">{items.length}</span></h2>
      <p className="hint">Rassemblez les extraits utiles, choisissez un format, copiez le tout.</p>
      <div className="bitems">
        {!items.length && <p className="hint">Vide. Cliquez « Ajouter au panier » sur un résultat.</p>}
        {items.map(r => (
          <div className="bitem" key={r.id}>
            <span>{r.title}</span>
            <button aria-label={`Retirer ${r.title}`} onClick={() => toggleBasket(r.id)}>×</button>
          </div>
        ))}
      </div>
      <label htmlFor="fmt" className="hint">Format de sortie</label>
      <select id="fmt" value={format} onChange={e => setFormat(e.target.value)}>
        {groups.map(g => (
          <optgroup key={g} label={g}>
            {CITATION_FORMATS.filter(f => f.group === g).map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
          </optgroup>
        ))}
      </select>
      {refOnly.length > 0 && (
        <div className="warnbox">
          {refOnly.length} élément{refOnly.length > 1 ? 's' : ''} non validé{refOnly.length > 1 ? 's' : ''} pour usage client ({refOnly.map(r => r.id).join(', ')}) :
          la référence est conservée, l'extrait est remplacé par un emplacement <strong>« à reformuler »</strong>.
        </div>
      )}
      <textarea id="basket-output" readOnly value={text} aria-label="Texte à copier" />
      <div className="actions">
        <button className="btn primary" disabled={!items.length} onClick={copyAll}>Copier le texte</button>
        <button className="btn" disabled={!items.length} onClick={() => { clearBasket(); showToast('Panier vidé'); }}>Vider le panier</button>
      </div>
    </aside>
  );
}
