import React from 'react';
import VoiceField from './VoiceField.jsx';
import { normalizeDecision, ACTION_CATEGORIES } from './decisionSupport.js';
import { allowsInterventions, interventionWarnings, clientInterventions } from './interventions.js';
import ScreenDisclosure, { DisclosureControls, useScreenPresentation, excerpt } from './ScreenDisclosure.jsx';
import { orderedObservations, observationNumber } from './observationOrder.js';

function References({ label, collection, selected, onChange }) {
  const options = [...collection, ...selected.filter(id => !collection.some(row => row.id === id)).map(id => ({ id, label: `Référence introuvable (${id})` }))];
  return <fieldset className="decision-refs"><legend>{label}</legend>{options.length ? options.map((row, i) => <label key={`${row.id}-${i}`}>
    <input type="checkbox" checked={selected.includes(row.id)} onChange={e => onChange(e.target.checked ? [...new Set([...selected, row.id])] : selected.filter(id => id !== row.id))} />{row.label}
  </label>) : <p className="muted">Ajoutez d’abord un élément à relier.</p>}</fieldset>;
}

export default function InterventionsPanel({ report, setReport, dictationAllowed = false }) {
  const presentation = useScreenPresentation();
  if (!allowsInterventions(report)) return null;
  const d = normalizeDecision(report.decision);
  if (d.schema_version !== 1) return <p className="issue-list warning">Format des interventions non pris en charge. Conservez le JSON d’origine avant toute modification.</p>;
  const update = change => setReport(prev => ({ ...prev, decision: change(normalizeDecision(prev.decision)) }));
  const changeRow = (index, key, value) => update(prev => ({ ...prev, actions: prev.actions.map((row, i) => i === index ? { ...row, [key]: typeof value === 'function' ? value(row[key] || '') : value } : row) }));
  const observations = orderedObservations(report).map(o => ({ id: o.id, label: `${observationNumber(report, o)} · ${o.titre || 'Constat sans titre'}` }));
  const expectations = d.attentes.map(a => ({ id: a.id, label: a.libelle || 'Attente sans intitulé' }));
  const warnings = interventionWarnings(report);
  const clientIds = new Set(clientInterventions(report).map(action => action.id));
  return <fieldset className="decision-support"><legend>Interventions proposées</legend>
    <p>Précisez les suites utiles à partir des constats et des attentes. Ces propositions restent à discuter ; elles ne valent pas autorisation de travaux.</p>
    <p className="muted">Les modifications suivent le brouillon et la sauvegarde en ligne du dossier. Un horizon peut rester à préciser.</p>
    <DisclosureControls label="Affichage des interventions" ids={d.actions.map(action => `intervention-${action.id}`)} />
    {d.actions.map((action, index) => <article className="decision-card progressive-intervention" key={`${action.id}-${index}`} aria-label={`Intervention ${index + 1}`}>
      <ScreenDisclosure name={`intervention-${action.id}`} title={`Intervention ${index + 1} · ${excerpt(action.intitule, 180) || 'Intitulé à préciser'}`}
        summary={[action.categorie || 'Nature à préciser', excerpt(action.priorite, 90), excerpt(action.horizon, 90),
          `Constats : ${action.observation_ids.map(id => { const rows = report.observations.filter(o => o.id === id); return rows.length === 1 ? observationNumber(report, rows[0]) : 'référence à vérifier'; }).join(', ') || 'à relier'}`,
          `Attentes : ${action.attente_ids.map(id => { const i = d.attentes.findIndex(a => a.id === id); return i >= 0 ? i + 1 : 'référence à vérifier'; }).join(', ') || 'à relier'}`].filter(Boolean).join(' · ')}
        status={action.inclure_client !== true ? 'Rapport expert uniquement' : clientIds.has(action.id) ? 'Retenue dans la synthèse client' : 'Exclue de la synthèse client : constats ou références à vérifier'}>
      <VoiceField label="Intitulé de l’intervention" rows={2} maxLength={8000} micDisabled={!dictationAllowed} value={action.intitule} onChange={v => changeRow(index, 'intitule', v)} />
      <label>Nature de l’intervention<select value={action.categorie} onChange={e => changeRow(index, 'categorie', e.target.value)}><option value="">À classer</option>
        {action.categorie && !ACTION_CATEGORIES.includes(action.categorie) && <option>{action.categorie}</option>}{ACTION_CATEGORIES.map(category => <option key={category}>{category}</option>)}
      </select></label>
      <References label="Constats concernés par l’intervention" collection={observations} selected={action.observation_ids} onChange={v => changeRow(index, 'observation_ids', v)} />
      <References label="Attentes concernées par l’intervention" collection={expectations} selected={action.attente_ids} onChange={v => changeRow(index, 'attente_ids', v)} />
      <div className="decision-grid">{[['priorite', 'Priorité proposée'], ['horizon', 'Horizon proposé'], ['realisation', 'Modalités de réalisation et limites'], ['prealables', 'Préalables et contraintes'], ['explication', 'Justification et vérifications']].map(([key, label]) =>
        <VoiceField key={key} label={label} rows={2} maxLength={8000} micDisabled={!dictationAllowed} value={typeof action[key] === 'string' ? action[key] : ''} onChange={v => changeRow(index, key, v)} />)}</div>
      <label className="decision-check"><input type="checkbox" checked={action.inclure_client === true} onChange={e => changeRow(index, 'inclure_client', e.target.checked)} />Présenter cette intervention dans la synthèse client</label>
      <p className="muted">Elle apparaît seulement si tous ses constats sont retenus dans la synthèse. Les préalables et la justification restent dans le rapport expert.</p>
      <button type="button" className="button ghost" onClick={() => update(prev => ({ ...prev, actions: prev.actions.filter((_, i) => i !== index) }))}>Supprimer cette intervention</button>
      </ScreenDisclosure>
    </article>)}
    <button type="button" className="button secondary" disabled={d.actions.length >= 100} onClick={() => { const action = { id: crypto.randomUUID(), intitule: '', categorie: '', incontournable: false, observation_ids: [], attente_ids: [], priorite: '', horizon: '', realisation: '', prealables: '', explication: '', inclure_client: false }; update(prev => ({ ...prev, actions: [...prev.actions, action] })); presentation.setOpen(`intervention-${action.id}`, true); }}>Ajouter une intervention</button>
    {warnings.length > 0 && <div className="issue-list warning"><strong>Interventions à relire</strong><ul>{warnings.map(warning => <li key={warning}>{warning}</li>)}</ul></div>}
  </fieldset>;
}
