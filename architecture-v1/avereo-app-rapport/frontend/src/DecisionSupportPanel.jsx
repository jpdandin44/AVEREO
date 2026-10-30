import React from 'react';
import { normalizeDecision, decisionComparison, decisionWarnings, DECISION_CRITERIA, ACTION_CATEGORIES } from './decisionSupport.js';

const newId = () => crypto.randomUUID();
function Text({ label, value, onChange }) {
  return <label>{label}<textarea rows={2} maxLength={8000} value={value || ''} onChange={e => onChange(e.target.value)} /></label>;
}
function Refs({ label, collection, selected, field, onChange }) {
  const options = [...collection.map((r, i) => ({ id: r.id, name: r[field] || `Sans intitulé ${i + 1}` })),
    ...selected.filter(id => !collection.some(r => r.id === id)).map(id => ({ id, name: `Référence introuvable (${id})` }))];
  return <fieldset className="decision-refs"><legend>{label}</legend>{options.length ? options.map((r, i) =>
    <label key={`${r.id}-${i}`}><input type="checkbox" checked={selected.includes(r.id)}
      onChange={e => onChange(e.target.checked
        ? [...new Set(options.filter(option => option.id === r.id || selected.includes(option.id)).map(option => option.id))]
        : selected.filter(id => id !== r.id))} />{r.name}</label>)
    : <p className="muted">Ajoutez d’abord un élément à relier.</p>}</fieldset>;
}
function Remove({ label, onClick }) {
  return <button type="button" className="button ghost" onClick={onClick}>Supprimer {label}</button>;
}

export default function DecisionSupportPanel({ report, setReport }) {
  const d = normalizeDecision(report.decision), observations = report.observations || [];
  const update = transform => setReport(prev => ({ ...prev, decision: transform(normalizeDecision(prev.decision)) }));
  const group = (key, field, value) => update(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  const row = (key, index, field, value) => update(prev => ({ ...prev, [key]: prev[key].map((r, i) => i === index ? { ...r, [field]: value } : r) }));
  const add = (key, value) => update(prev => ({ ...prev, [key]: [...prev[key], { id: newId(), ...value }] }));
  const remove = (key, index) => update(prev => ({ ...prev, [key]: prev[key].filter((r, i) => i !== index) }));
  const warnings = decisionWarnings(report);
  if (d.schema_version !== 1) return <p className="issue-list warning">Format d’aide à la décision non pris en charge. Conservez le JSON d’origine et vérifiez la version de l’application avant modification.</p>;
  return <fieldset className="decision-support"><legend>Aide à la décision · Visite Globale</legend>
    <p>Reliez ce qui est observé à ce qui compte pour les habitants. Organisez les actions, puis comparez deux options. Les contenus sont proposés par le professionnel et restent à discuter.</p>
    <details><summary>Relire les notes de l’entretien</summary><p><strong>Attentes exprimées :</strong> {report.ecoute?.attentes_client || 'Non renseignées'}</p>
      <p><strong>Contraintes et horizon évoqués :</strong> {report.ecoute?.contraintes_projet || 'Non renseignés'}</p>
      <p>Ces notes restent le verbatim. Renseignez ci-dessous une structuration explicite, sans déduire automatiquement de nouveaux besoins.</p></details>

    <details open><summary>1 · Cadre permanent et attentes des habitants</summary>
      <div className="decision-grid">{[['occupation', 'Occupation et usages permanents'], ['sensibilites', 'Sensibilités déclarées'],
        ['non_negociables', 'Non négociables déclarés'], ['tolerances', 'Tolérances et ressentis déclarés']].map(([key, label]) =>
        <Text key={key} label={label} value={d.habitants[key]} onChange={value => group('habitants', key, value)} />)}</div>
      {d.attentes.map((a, i) => <article className="decision-card" key={`${a.id}-${i}`} aria-label={`Attente ${i + 1}`}>
        <h4>Attente {i + 1}</h4><Text label="Attente formulée" value={a.libelle} onChange={v => row('attentes', i, 'libelle', v)} />
        <Text label="Priorité déclarée" value={a.priorite} onChange={v => row('attentes', i, 'priorite', v)} />
        <Text label="Source et confirmation à recueillir" value={a.source} onChange={v => row('attentes', i, 'source', v)} />
        <Remove label="cette attente" onClick={() => remove('attentes', i)} /></article>)}
      <button type="button" className="button secondary" disabled={d.attentes.length >= 100} onClick={() => add('attentes', { libelle: '', priorite: '', source: '' })}>Ajouter une attente</button>
    </details>

    <details><summary>2 · Projet des habitants</summary><p>Le budget est une déclaration ou une hypothèse sourcée. Un champ vide reste inconnu.</p>
      <div className="decision-grid">{[['objectif', 'Objectif initial du projet'], ['budget', 'Budget déclaré et source'], ['calendrier', 'Calendrier souhaité'],
        ['delegation', 'Délégation souhaitée'], ['diy', 'DIY envisagé et limites']].map(([key, label]) =>
        <Text key={key} label={label} value={d.projet[key]} onChange={value => group('projet', key, value)} />)}</div>
    </details>

    <details><summary>3 · Du constat à son effet pour les habitants</summary>
      {d.liens.map((l, i) => <article className="decision-card" key={`${l.id}-${i}`} aria-label={`Lien ${i + 1}`}><h4>Lien {i + 1}</h4>
        <label>Constat du bilan<select value={l.observation_id} onChange={e => row('liens', i, 'observation_id', e.target.value)}><option value="">Choisir un constat</option>
          {l.observation_id && !observations.some(o => o.id === l.observation_id) && <option value={l.observation_id}>Référence introuvable ({l.observation_id})</option>}
          {observations.map((o, n) => <option key={`${o.id}-${n}`} value={o.id}>{o.titre || `Constat ${n + 1}`}</option>)}</select></label>
        <Refs label="Attentes concernées par ce constat" collection={d.attentes} field="libelle" selected={l.attente_ids} onChange={v => row('liens', i, 'attente_ids', v)} />
        <Text label="Effet, opportunité ou faiblesse pour les habitants" value={l.effet} onChange={v => row('liens', i, 'effet', v)} />
        <Text label="Hypothèses et vérifications nécessaires" value={l.verification} onChange={v => row('liens', i, 'verification', v)} />
        <Remove label="ce lien" onClick={() => remove('liens', i)} /></article>)}
      <button type="button" className="button secondary" disabled={d.liens.length >= 100} onClick={() => add('liens', { observation_id: '', attente_ids: [], effet: '', verification: '' })}>Ajouter un lien constat / attentes</button>
    </details>

    <details><summary>4 · Projection 1 : organiser les actions</summary>
      {d.actions.map((a, i) => <article className="decision-card" key={`${a.id}-${i}`} aria-label={`Action ${i + 1}`}><h4>Action {i + 1}</h4>
        <Text label="Intitulé de l’action" value={a.intitule} onChange={v => row('actions', i, 'intitule', v)} />
        <label>Mode d’intervention<select value={a.categorie} onChange={e => row('actions', i, 'categorie', e.target.value)}><option value="">À classer</option>
          {a.categorie && !ACTION_CATEGORIES.includes(a.categorie) && <option>{a.categorie}</option>}{ACTION_CATEGORIES.map(c => <option key={c}>{c}</option>)}</select></label>
        <label className="decision-check"><input type="checkbox" checked={a.incontournable} onChange={e => row('actions', i, 'incontournable', e.target.checked)} />Incontournable proposé dans les deux options</label>
        <Refs label="Constats à l’origine de l’action" collection={observations} field="titre" selected={a.observation_ids} onChange={v => row('actions', i, 'observation_ids', v)} />
        <Refs label="Attentes servies par l’action" collection={d.attentes} field="libelle" selected={a.attente_ids} onChange={v => row('actions', i, 'attente_ids', v)} />
        <div className="decision-grid">{[['priorite', 'Priorité proposée'], ['horizon', 'Horizon de l’action'], ['prealables', 'Préalables et contraintes'], ['explication', 'Explicatif générique et limites']].map(([key, label]) =>
          <Text key={key} label={label} value={a[key]} onChange={v => row('actions', i, key, v)} />)}</div>
        <Remove label="cette action" onClick={() => remove('actions', i)} /></article>)}
      <button type="button" className="button secondary" disabled={d.actions.length >= 100} onClick={() => add('actions', { intitule: '', categorie: '', incontournable: false, observation_ids: [], attente_ids: [], priorite: '', horizon: '', prealables: '', explication: '' })}>Ajouter une action</button>
    </details>

    <details><summary>5 · Projection 2 : préparer deux options comparables</summary><p>Les critères sont identiques. Décrivez les conséquences, leurs sources et leurs inconnues. Aucun score ni montant n’est calculé.</p>
      <div className="decision-grid">{['option_a', 'option_b'].map((key, i) => <article className="decision-card" key={key} aria-label={`Option ${i ? 'B' : 'A'}`}>
        <h4>Option {i ? 'B' : 'A'}</h4><Text label={`Nom de l’option ${i ? 'B' : 'A'}`} value={d[key].nom} onChange={v => group(key, 'nom', v)} />
        <Text label={`Objectif de l’option ${i ? 'B' : 'A'}`} value={d[key].objectif} onChange={v => group(key, 'objectif', v)} />
        <Refs label={`Actions de l’option ${i ? 'B' : 'A'}`} collection={d.actions} field="intitule" selected={d[key].action_ids} onChange={v => group(key, 'action_ids', v)} />
        {DECISION_CRITERIA.map(([criterion, label]) => <Text key={criterion} label={`Option ${i ? 'B' : 'A'} — ${label}`} value={d[key].criteres[criterion]}
          onChange={v => update(prev => ({ ...prev, [key]: { ...prev[key], criteres: { ...prev[key].criteres, [criterion]: v } } }))} />)}</article>)}</div>
    </details>

    <details open><summary>6 · Comparer les conséquences et préparer l’arbitrage</summary>
      <div className="decision-table"><table><caption>Comparaison sur les mêmes critères</caption><thead><tr><th>Critère</th><th>{d.option_a.nom}</th><th>{d.option_b.nom}</th></tr></thead>
        <tbody>{decisionComparison(report).map(r => <tr key={r.key}><th scope="row">{r.label}</th><td>{r.a}</td><td>{r.b}</td></tr>)}</tbody></table></div>
      <label>Option proposée à la discussion<select value={d.arbitrage.option_proposee} onChange={e => group('arbitrage', 'option_proposee', e.target.value)}>
        <option value="">Aucune option retenue</option><option value="a">{d.option_a.nom}</option><option value="b">{d.option_b.nom}</option>
        {d.arbitrage.option_proposee && !['a', 'b'].includes(d.arbitrage.option_proposee) && <option value={d.arbitrage.option_proposee}>Référence introuvable</option>}</select></label>
      <Text label="Motif et compromis à discuter" value={d.arbitrage.motif} onChange={v => group('arbitrage', 'motif', v)} />
      <Text label="Prochaine étape à convenir" value={d.arbitrage.prochaine_etape} onChange={v => group('arbitrage', 'prochaine_etape', v)} />
      <p className="muted">Cette proposition ne vaut pas accord des habitants, validation technique ou autorisation de travaux.</p>
      {warnings.length > 0 && <div className="issue-list warning"><strong>Points restant à compléter</strong><ul>{warnings.map(w => <li key={w}>{w}</li>)}</ul></div>}
    </details>
  </fieldset>;
}
