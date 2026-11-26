import { allowsInterventionActions } from './reportProfiles.js';
import { selectClientInterventions } from './interventionSelection.js';
import { normalizeDecision, referenceLabel, ACTION_CATEGORIES } from './decisionSupport.js';
import { observationNumber } from './observationOrder.js';
import { escapeHtml, textToHtml } from './reportHtml.js';

export function allowsInterventions(report) {
  return allowsInterventionActions(report);
}

export function interventionWarnings(report) {
  if (!allowsInterventions(report)) return [];
  const d = normalizeDecision(report.decision), warnings = [], seen = new Set();
  const clientIds = new Set(clientInterventions(report).map(action => action.id));
  for (const action of d.actions) {
    if (!action.id || seen.has(action.id)) warnings.push('Interventions : identifiant absent ou dupliqué.');
    seen.add(action.id);
    const label = action.intitule || 'Sans intitulé';
    if (!action.intitule.trim() || !ACTION_CATEGORIES.includes(action.categorie)) warnings.push(`${label} : intitulé ou nature à préciser.`);
    for (const [collection, ids, field, name] of [[report.observations || [], action.observation_ids, 'titre', 'constat'], [d.attentes, action.attente_ids, 'libelle', 'attente']]) {
      if (!ids.length) warnings.push(`${label} : ${name === 'constat' ? 'lien au constat' : 'lien à l’attente'} à préciser.`);
      for (const id of ids) if (collection.filter(row => row.id === id).length !== 1) warnings.push(`${label} / ${name} : ${referenceLabel(collection, id, field)}.`);
    }
    if (action.inclure_client === true && !clientIds.has(action.id)) warnings.push(`${label} : exclue de la synthèse tant que tous ses constats ne sont pas retenus et ses références uniques.`);
  }
  return [...new Set(warnings)];
}

export function clientInterventions(report) {
  if (!allowsInterventions(report)) return [];
  const d = normalizeDecision(report.decision);
  return selectClientInterventions(report, d.actions);
}

export function buildInterventionsHtml(report, client = false) {
  if (!allowsInterventions(report) || (report.decision?.schema_version != null && report.decision.schema_version !== 1)) return '';
  const d = normalizeDecision(report.decision), actions = client ? clientInterventions(report) : d.actions;
  if (!actions.length) return '';
  const text = v => textToHtml(typeof v === 'string' && v.trim() ? v : 'À préciser');
  const names = (collection, selected, field) => selected.map(id => referenceLabel(collection, id, field)).join('\n');
  const observations = (report.observations || []).map(o => ({ ...o, titre: `${observationNumber(report, o)} · ${o.titre || 'Constat sans titre'}` }));
  return `<section class="decision-report interventions-report${client ? ' client-page' : ''}"><h2>Interventions proposées</h2><p>Propositions à discuter avec les habitants. Les horizons restent indicatifs ; aucune autorisation de travaux n’est déduite.</p>${actions.map(a => {
    const rows = [['Nature et priorité', `${a.categorie || 'À classer'} · ${a.priorite || 'À discuter'}`], ['Constats concernés', names(observations, a.observation_ids, 'titre')],
      ['Horizon proposé', a.horizon], ['Modalités de réalisation et limites', a.realisation]];
    if (!client) rows.push(['Attentes concernées', names(d.attentes, a.attente_ids, 'libelle')], ['Préalables et contraintes', a.prealables], ['Justification et vérifications', a.explication]);
    return `<h3>${escapeHtml(a.intitule || 'Intervention à préciser')}</h3><table><thead><tr><th>Rubrique</th><th>Proposition</th></tr></thead><tbody>${rows.map(([label, value]) => `<tr><th scope="row">${escapeHtml(label)}</th><td>${text(value)}</td></tr>`).join('')}</tbody></table>`;
  }).join('')}</section>`;
}
