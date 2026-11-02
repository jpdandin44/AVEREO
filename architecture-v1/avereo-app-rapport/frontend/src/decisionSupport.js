import { escapeHtml, textToHtml } from './reportHtml.js';
import { isHabitologieReport } from './reportClassification.js';

export const DECISION_CRITERIA = [
  ['energie', 'Énergie : type et quantité'], ['materiaux', 'Matériaux et compatibilité'],
  ['usage', 'Coût et qualité d’usage'], ['aides', 'Aides à vérifier'],
  ['realisation', 'DIY et délégation'], ['budget', 'Budget'],
  ['calendrier', 'Calendrier'], ['occupation', 'Occupation pendant les travaux'],
  ['incertitudes', 'Hypothèses et inconnues'],
];
export const ACTION_CATEGORIES = ['Correctif', 'Préventif', 'Évolutif'];
const string = v => typeof v === 'string' ? v : '';
const object = v => v && typeof v === 'object' && !Array.isArray(v) ? v : {};
const rows = v => Array.isArray(v) ? v.map(object) : [];
const ids = v => Array.isArray(v) ? v.filter(id => typeof id === 'string') : [];
const fields = (value, keys) => Object.fromEntries(keys.map(key => [key, string(value[key])]));

export function emptyDecisionOption(name) {
  return { nom: name, objectif: '', action_ids: [], criteres: Object.fromEntries(DECISION_CRITERIA.map(([key]) => [key, ''])) };
}

export function normalizeDecision(value) {
  const d = object(value);
  const option = (v, name) => {
    const o = object(v);
    return { ...o, nom: string(o.nom) || name, objectif: string(o.objectif), action_ids: ids(o.action_ids),
      criteres: fields(object(o.criteres), DECISION_CRITERIA.map(([key]) => key)) };
  };
  return { ...d, schema_version: d.schema_version ?? 1,
    habitants: fields(object(d.habitants), ['occupation', 'sensibilites', 'non_negociables', 'tolerances']),
    projet: fields(object(d.projet), ['objectif', 'budget', 'calendrier', 'delegation', 'diy']),
    attentes: rows(d.attentes).map(a => ({ ...a, ...fields(a, ['id', 'libelle', 'priorite', 'source']) })),
    liens: rows(d.liens).map(l => ({ ...l, ...fields(l, ['id', 'observation_id', 'effet', 'verification']), attente_ids: ids(l.attente_ids) })),
    actions: rows(d.actions).map(a => ({ ...a, ...fields(a, ['id', 'intitule', 'categorie', 'priorite', 'horizon', 'prealables', 'explication']),
      incontournable: a.incontournable === true, observation_ids: ids(a.observation_ids), attente_ids: ids(a.attente_ids) })),
    option_a: option(d.option_a, 'Option A'), option_b: option(d.option_b, 'Option B'),
    arbitrage: fields(object(d.arbitrage), ['option_proposee', 'motif', 'prochaine_etape']),
  };
}

export function hasDecisionData(report) {
  const d = normalizeDecision(report.decision);
  return [...Object.values(d.habitants), ...Object.values(d.projet), ...Object.values(d.arbitrage),
    ...Object.values(d.option_a.criteres), ...Object.values(d.option_b.criteres), d.option_a.objectif, d.option_b.objectif,
  ].some(v => v.trim()) || d.attentes.length > 0 || d.liens.length > 0 || d.actions.length > 0
    || d.option_a.action_ids.length > 0 || d.option_b.action_ids.length > 0
    || d.option_a.nom !== 'Option A' || d.option_b.nom !== 'Option B';
}

export function referenceLabel(collection, id, field) {
  const matches = collection.filter(row => row.id === id);
  if (matches.length !== 1) return `Référence ${matches.length ? 'ambiguë' : 'introuvable'} (${id || 'sans identifiant'})`;
  return matches[0][field] || `Sans intitulé (${id})`;
}

export function decisionWarnings(report) {
  if (!hasDecisionData(report)) return [];
  const d = normalizeDecision(report.decision), warnings = [];
  if (d.schema_version !== 1) warnings.push('Format d’aide à la décision non pris en charge ; conserver le JSON d’origine.');
  const obs = report.observations || [];
  for (const [label, collection] of [['Attentes', d.attentes], ['Liens', d.liens], ['Actions', d.actions]]) {
    const seen = new Set();
    for (const row of collection) {
      if (!row.id || seen.has(row.id)) warnings.push(`${label} : identifiant absent ou dupliqué.`);
      seen.add(row.id);
    }
  }
  const check = (collection, selected, label) => {
    for (const id of selected) if (collection.filter(row => row.id === id).length !== 1) warnings.push(`${label} : ${referenceLabel(collection, id, 'titre')}.`);
  };
  for (const link of d.liens) {
    check(obs, [link.observation_id], 'Bilan'); check(d.attentes, link.attente_ids, 'Bilan / attente');
    if (!link.attente_ids.length || !link.effet.trim()) warnings.push('Bilan : préciser une attente et son effet pour les habitants.');
  }
  for (const action of d.actions) {
    check(obs, action.observation_ids, 'Action / constat'); check(d.attentes, action.attente_ids, 'Action / attente');
    if (!action.intitule.trim() || !ACTION_CATEGORIES.includes(action.categorie)) warnings.push('Action : intitulé ou catégorie à compléter.');
    if (!action.observation_ids.length || !action.attente_ids.length) warnings.push(`Action « ${action.intitule || 'sans intitulé'} » : lien au constat ou à l’attente à préciser.`);
  }
  for (const key of ['option_a', 'option_b']) {
    const option = d[key]; check(d.actions, option.action_ids, `${option.nom} / action`);
    if (!option.objectif.trim() || !option.action_ids.length) warnings.push(`${option.nom} : objectif et actions à préciser.`);
    for (const action of d.actions.filter(a => a.incontournable)) if (!option.action_ids.includes(action.id)) warnings.push(`${option.nom} : l’action incontournable « ${action.intitule || action.id} » est omise.`);
  }
  if (!d.projet.budget.trim()) warnings.push('Budget des habitants non renseigné ; aucune faisabilité financière n’est établie.');
  if (d.arbitrage.option_proposee && !['a', 'b'].includes(d.arbitrage.option_proposee)) warnings.push('Option proposée introuvable ; arbitrage à reprendre.');
  return [...new Set(warnings)];
}

export function decisionComparison(report) {
  const d = normalizeDecision(report.decision);
  return DECISION_CRITERIA.map(([key, label]) => ({ key, label,
    a: d.option_a.criteres[key].trim() || 'À évaluer', b: d.option_b.criteres[key].trim() || 'À évaluer' }));
}

const cell = v => textToHtml(v || 'Non renseigné');
const table = (headers, values) => `<table><thead><tr>${headers.map(h => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead><tbody>${values.map(row => `<tr>${row.map(v => `<td>${cell(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;

export function buildDecisionHtml(report, client = false) {
  if (!isHabitologieReport(report) || !hasDecisionData(report)) return '';
  if (report.decision?.schema_version != null && report.decision.schema_version !== 1) return '<section><h2>Aide à la décision</h2><p>Format non pris en charge ; conserver le JSON d’origine et vérifier la version de l’application.</p></section>';
  const d = normalizeDecision(report.decision), obs = report.observations || [];
  const names = (collection, selected, field) => selected.map(id => referenceLabel(collection, id, field)).join('\n') || 'À relier';
  let content = `<section class="decision-report client-page"><h2>Aide à la décision</h2><p class="status">Options proposées à discuter et à relire avec les habitants. Aucun choix ni validation n’est déduit de ce tableau.</p>`;
  content += `<h3>Attentes retenues</h3>${table(client ? ['Attente', 'Priorité'] : ['Attente', 'Priorité', 'Source'],
    d.attentes.map(a => client ? [a.libelle, a.priorite] : [a.libelle, a.priorite, a.source]))}`;
  if (!client) {
    content += `<h3>Cadre permanent des habitants</h3>${table(['Rubrique', 'Déclaration'], [
      ['Occupation', d.habitants.occupation], ['Sensibilités', d.habitants.sensibilites],
      ['Non négociables', d.habitants.non_negociables], ['Tolérances déclarées', d.habitants.tolerances]])}`;
    content += `<h3>Projet des habitants</h3>${table(['Rubrique', 'Donnée déclarée'], [
      ['Objectif initial', d.projet.objectif], ['Budget', d.projet.budget], ['Calendrier', d.projet.calendrier],
      ['Délégation', d.projet.delegation], ['DIY envisagé', d.projet.diy]])}`;
    content += `<h3>Du constat à son effet pour les habitants</h3>${table(['Constat / attentes', 'Effet, opportunité ou faiblesse', 'Vérifications'], d.liens.map(l => [
      `${referenceLabel(obs, l.observation_id, 'titre')}\nAttentes : ${names(d.attentes, l.attente_ids, 'libelle')}`, l.effet, l.verification]))}`;
    content += '<h3>Projection 1 · Organiser les actions</h3>';
    for (const a of d.actions) content += `<h4>${escapeHtml(a.intitule || 'Action à préciser')}</h4>${table(['Rubrique', 'Contenu'], [
      ['Mode et priorité', `${a.categorie || 'À classer'} · ${a.priorite || 'À discuter'}${a.incontournable ? ' · Incontournable proposé' : ''}`],
      ['Constats', names(obs, a.observation_ids, 'titre')], ['Attentes', names(d.attentes, a.attente_ids, 'libelle')],
      ['Horizon et préalables', `${a.horizon || 'Horizon à préciser'}\n${a.prealables || 'Préalables à préciser'}`], ['Explicatif', a.explication]])}`;
  }
  content += '<h3>Projection 2 · Deux options de projet</h3>';
  for (const key of ['option_a', 'option_b']) {
    const o = d[key]; content += `<h4>${escapeHtml(o.nom)}</h4><p>${cell(o.objectif)}</p><p>Actions : ${cell(names(d.actions, o.action_ids, 'intitule'))}</p>`;
  }
  content += `<h3>Comparaison des conséquences</h3>${table(['Critère', d.option_a.nom, d.option_b.nom], decisionComparison(report).map(r => [r.label, r.a, r.b]))}`;
  const proposed = ['a', 'b'].includes(d.arbitrage.option_proposee) ? d[`option_${d.arbitrage.option_proposee}`].nom : 'Aucune option retenue';
  content += `<section${client ? '' : ' class="client-page"'}><h3>Arbitrage à discuter</h3><p>${cell(proposed)}</p><p>${cell(d.arbitrage.motif)}</p><p>Prochaine étape : ${cell(d.arbitrage.prochaine_etape)}</p>`;
  const warnings = decisionWarnings(report);
  if (warnings.length) content += `<h3>Points restant à compléter</h3><ul>${warnings.map(w => `<li>${escapeHtml(w)}</li>`).join('')}</ul>`;
  return content + '<p class="muted">Les conséquences sont rédigées sous hypothèses par le professionnel. Une cellule non évaluée ne signifie ni absence d’effet ni absence de risque. Montants d’aides, économies et durées de vie ne sont pas calculés par ce module.</p></section></section>';
}
