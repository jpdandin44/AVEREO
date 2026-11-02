import React, { useState } from 'react';
import { deliveryOptions } from './reportDelivery.js';
import { REPORT_VISUALS } from './reportVisuals.js';

export default function ReportDeliveryOptions({ report, setReport }) {
  const value = deliveryOptions(report);
  const [error, setError] = useState('');
  const update = patch => setReport(previous => ({ ...previous, livrable: { ...deliveryOptions(previous), ...patch } }));
  const toggle = (key, id, checked) => update({ [key]: checked ? [...value[key], id] : value[key].filter(v => v !== id) });
  const addAnnex = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > 2 * 1024 * 1024) {
      setError('Choisir une image PNG ou JPEG de moins de 2 Mio.'); return;
    }
    try {
      const src = await new Promise((resolve, reject) => {
        const reader = new FileReader(); reader.onload = () => resolve(reader.result); reader.onerror = reject; reader.readAsDataURL(file);
      });
      setReport(previous => ({ ...previous, livrable: { ...deliveryOptions(previous), annexes: [...deliveryOptions(previous).annexes,
        { title: file.name, src, caption: '', source: '' }] } }));
      setError('');
    } catch { setError('Cette image ne peut pas être lue.'); }
  };
  const updateAnnex = (index, patch) => update({ annexes: value.annexes.map((a, i) => i === index ? { ...a, ...patch } : a) });
  return <fieldset className="delivery-options">
    <legend>Livrable AVEREO</legend>
    <p>Un dossier, deux restitutions. Le JSON conserve toutes les données, quel que soit le livrable choisi.</p>
    <label>Destinataire du document
      <select value={value.audience} onChange={e => update({ audience: e.target.value })}>
        <option value="expert">Rapport expert détaillé</option><option value="client">Synthèse client illustrée</option>
      </select>
    </label>
    {value.audience === 'client' && <>
      <p>Rédigez une synthèse brève, puis retenez jusqu’à trois constats. Les détails restent dans le rapport expert.</p>
      { [['synthese','L’essentiel pour le client'], ['priorites','Actions prioritaires'], ['suite','Prochaine étape'], ['limites_client','Limites essentielles à rappeler au client']].map(([key,label]) =>
        <label key={key}>{label}<textarea rows={3} maxLength={1600} value={value[key]} onChange={e => update({ [key]: e.target.value })} /></label>)}
      <div className="delivery-choices">{report.observations.map((o, index) => <label key={o.id}>
        <input type="checkbox" checked={value.observations.includes(o.id)} disabled={!value.observations.includes(o.id) && value.observations.length >= 3}
          onChange={e => toggle('observations', o.id, e.target.checked)} />{o.titre || `Constat ${index + 1}`}
      </label>)}</div>
    </>}
    <h3>Illustrations pédagogiques</h3>
    <p>Sélectionnez uniquement les schémas utiles à cette expertise. Ils ne constituent pas des mesures du bâtiment.</p>
    <div className="delivery-choices">{REPORT_VISUALS.filter(v => value.audience !== 'client' || v.client).map(v => <label key={v.id}>
      <input type="checkbox" checked={value.visuels.includes(v.id)} onChange={e => toggle('visuels', v.id, e.target.checked)} />{v.title}
    </label>)}</div>
    <details><summary>Pièces illustrées propres au dossier — rapport expert ({value.annexes.length})</summary>
      <p>Tableau des risques, capture Ubakus, plan : ajoutez la pièce et ses hypothèses. Ces images sont sauvegardées avec ce dossier.</p>
      {value.annexes.map((a, i) => <div className="delivery-annex" key={i}>
        <img src={a.src} alt={a.title} />
        <label>Titre de la pièce<input value={a.title || ''} onChange={e => updateAnnex(i, {title:e.target.value})} /></label>
        <label>Légende et limites<textarea value={a.caption || ''} onChange={e => updateAnnex(i, {caption:e.target.value})} /></label>
        <label>Source et date<input value={a.source || ''} onChange={e => updateAnnex(i, {source:e.target.value})} /></label>
        <button className="button ghost" type="button" onClick={() => update({ annexes:value.annexes.filter((_,n) => n !== i) })}>Retirer cette pièce</button>
      </div>)}
      <label>Ajouter une pièce illustrée<input type="file" accept="image/png,image/jpeg" onChange={addAnnex} /></label>
      {error && <p role="alert">{error}</p>}
    </details>
  </fieldset>;
}
