import React, { useEffect, useRef, useState } from 'react';
import { CATEGORIES } from './document-store.js';
import { CATEGORY_ICONS } from './document-settings.js';

const paths = {
  folder: 'M3 7h6l2 2h10v11H3z M3 7V4h6l2 3',
  file: 'M6 3h8l4 4v14H6z M14 3v5h4 M9 12h6 M9 16h6',
  home: 'M3 11l9-8 9 8 M5 10v11h14V10 M9 21v-8h6v8',
  ruler: 'M3 16L16 3l5 5L8 21z M8 11l2 2 M12 7l2 2 M4 15l2 2',
  hammer: 'M14 3l7 7-3 3-3-3-9 11-3-3 10-9-3-3z',
  shield: 'M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6z M8 12l3 3 5-6',
  key: 'M14 3a7 7 0 0 1 7 7 7 7 0 0 1-9 7l-3 4H3v-6l4-3a7 7 0 0 1 7-9z M16 7h1',
  leaf: 'M20 3c-12 0-17 5-15 12s15 7 15-12z M3 21L16 8',
};
export const ICON_NAMES = { folder: 'Dossier', file: 'Document', home: 'Maison', ruler: 'Plan et mesure', hammer: 'Travaux', shield: 'Diagnostic', key: 'Clé', leaf: 'Environnement' };
export function CategoryIcon({ appearance }) {
  const hex = appearance.color.slice(1), channels = [0, 2, 4].map(offset => parseInt(hex.slice(offset, offset + 2), 16));
  const light = channels[0] * .299 + channels[1] * .587 + channels[2] * .114 > 150;
  return <span className="category-icon" style={{ backgroundColor: appearance.color, color: light ? '#142A32' : '#FFFFFF' }} aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d={paths[appearance.icon] || paths.folder} /></svg></span>;
}
export function DocumentModal({ title, onClose, busy, children }) {
  const root = useRef(), previous = useRef();
  useEffect(() => { previous.current = document.activeElement; root.current?.querySelector('button')?.focus(); return () => previous.current?.focus(); }, []);
  function keys(e) {
    if (e.key === 'Escape' && !busy) onClose();
    if (e.key !== 'Tab') return;
    const controls = [...root.current.querySelectorAll('button:not(:disabled),input:not(:disabled),select:not(:disabled)')];
    if (!controls.length) { e.preventDefault(); return; }
    if (e.shiftKey && document.activeElement === controls[0]) { e.preventDefault(); controls.at(-1).focus(); }
    if (!e.shiftKey && document.activeElement === controls.at(-1)) { e.preventDefault(); controls[0].focus(); }
  }
  return <div className="document-reader-backdrop" role="dialog" aria-modal="true" aria-label={title} onKeyDown={keys}><div className="document-modal" ref={root}><header><h3>{title}</h3><button type="button" className="doc-secondary" disabled={busy} onClick={onClose}>Fermer</button></header>{children}</div></div>;
}
export function CategorySettings({ settings, busy, onSave, onClose }) {
  const [value, setValue] = useState(settings);
  function appearance(category, patch) { setValue(current => ({ ...current, categories: { ...current.categories, [category]: { ...current.categories[category], ...patch } } })); }
  return <DocumentModal title="Personnaliser les catégories" onClose={onClose} busy={busy}><form onSubmit={e => { e.preventDefault(); onSave(value); }}>
    <p>Choisissez l’apparence des dossiers de ce bien. Les documents conservent leur catégorie.</p>
    <div className="category-settings">{Object.entries(CATEGORIES).map(([category, name]) => <div className="category-setting" key={category}>
      <CategoryIcon appearance={value.categories[category]} /><strong>{name}</strong>
      <label>Icône<select aria-label={`Icône : ${name}`} value={value.categories[category].icon} disabled={busy} onChange={e => appearance(category, { icon: e.target.value })}>{CATEGORY_ICONS.map(icon => <option key={icon} value={icon}>{ICON_NAMES[icon]}</option>)}</select></label>
      <label>Couleur<input type="color" aria-label={`Couleur : ${name}`} value={value.categories[category].color} disabled={busy} onChange={e => appearance(category, { color: e.target.value })} /></label>
    </div>)}</div>
    <footer><button type="button" className="doc-secondary" disabled={busy} onClick={onClose}>Annuler</button><button type="submit" className="doc-primary" disabled={busy}>{busy ? 'Enregistrement…' : 'Enregistrer les catégories'}</button></footer>
  </form></DocumentModal>;
}
