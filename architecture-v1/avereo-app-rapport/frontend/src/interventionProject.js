import '../../../avereo-app-projet/frontend/public/planning-core.js';
import { normalizeDecision, ACTION_CATEGORIES } from './decisionSupport.js';
import { allowsInterventions } from './interventions.js';
import { observationNumber } from './observationOrder.js';

// Use Projet's validator, serializer and calendar, rather than a second scheduler.
const planning = globalThis.ProjetPlanning;
const object = value => value && typeof value === 'object' && !Array.isArray(value);
const settingsFields = ['titre', 'date_debut', 'date_cible', 'capacite_semaine', 'mode'];
const rowFields = ['charge', 'debut_minimal', 'responsable', 'periode_debut', 'duree_periodes'];

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && value.slice(0, 4) !== '0000' && date.toISOString().slice(0, 10) === value;
}
function positive(value) {
  try { return planning.parseNumber(value, 'Estimation', { min: Number.MIN_VALUE, max: 3650 }) > 0; }
  catch { return false; }
}

// Incomplete estimates are allowed in the report; malformed data is never rewritten.
export function interventionPlanningError(report, structuralOnly = false) {
  const d = report?.decision;
  if (!d || d.schema_version != null && d.schema_version !== 1) return null;
  const check = (value, fields, isRow) => {
    if (value === undefined) return null;
    if (!object(value) || !Object.keys(value).length) return 'Les paramètres du planning doivent être un objet renseigné.';
    for (const key of fields) {
      if (value[key] !== undefined && (typeof value[key] !== 'string' || value[key].length > (key === 'titre' || key === 'responsable' ? 200 : 20))) return 'Un champ du planning est invalide ou trop long.';
    }
    if (isRow && value.inclure !== undefined && typeof value.inclure !== 'boolean') return 'La sélection Projet doit être un choix oui/non.';
    if (!isRow && value.mode !== undefined && !['date','periodes'].includes(value.mode)) return 'Mode de planning invalide.';
    if (structuralOnly) return null;
    for (const key of isRow ? ['periode_debut','duree_periodes'] : []) if (value[key] && (!/^\d+$/.test(value[key]) || Number(value[key]) < 1 || Number(value[key]) > 120)) return 'Les périodes doivent être des entiers de 1 à 120.';
    for (const key of isRow ? ['debut_minimal'] : ['date_debut', 'date_cible']) if (value[key] && !validDate(value[key])) return 'Une date du planning est impossible.';
    const numeric = isRow ? 'charge' : 'capacite_semaine';
    if (value[numeric] && !positive(value[numeric])) return 'La charge et la capacité doivent être positives et ne pas dépasser 3 650 jours.';
    if (!isRow && value.date_debut && value.date_cible && value.date_cible < value.date_debut) return 'La date cible précède le début du projet.';
    return null;
  };
  let error = check(d.planning_projet, settingsFields, false);
  if (error) return error;
  for (const [index, row] of (Array.isArray(d.actions) ? d.actions : []).entries()) {
    error = check(row?.planning_projet, rowFields, true);
    if (error) return `Intervention ${index + 1} : ${error}`;
  }
  return null;
}

export function projectSettings(report) {
  const value = object(report.decision?.planning_projet) ? report.decision.planning_projet : {};
  return { mode: 'date', titre: `Interventions — ${report.reference_dossier || report.titre || 'Dossier Rapport'}`, date_debut: '', date_cible: '', capacite_semaine: '', ...value };
}

export function projectSelection(report) {
  return normalizeDecision(report.decision).actions.filter(action => action.planning_projet?.inclure === true);
}

export function buildInterventionProject(report) {
  if (!allowsInterventions(report)) throw new Error('Ce planning est disponible pour les interventions Habitologue en Visite Globale.');
  if (report.decision?.schema_version != null && report.decision.schema_version !== 1) throw new Error('Format des interventions non pris en charge.');
  const malformed = interventionPlanningError(report);
  if (malformed) throw new Error(malformed);
  const d = normalizeDecision(report.decision), selected = d.actions.filter(action => action.planning_projet?.inclure === true), settings = projectSettings(report);
  if (!selected.length) throw new Error('Sélectionnez au moins une intervention pour Projet.');
  if (!settings.titre.trim()) throw new Error('Renseignez le titre du projet.');
  const periods = settings.mode === 'periodes';
  if (!periods && !settings.date_debut) throw new Error('Renseignez la date de départ du planning.');
  if (!periods && !settings.capacite_semaine.trim()) throw new Error('Renseignez la capacité de travail par semaine.');
  const observationRefs = report.observations || [];
  const names = (collection, ids, field, label, observation = false) => {
    if (!ids.length) throw new Error(`Une intervention sélectionnée reste à relier à un ${label}.`);
    return ids.map(id => {
      const rows = collection.filter(row => row.id === id);
      if (rows.length !== 1) throw new Error(`Une référence de ${label} est absente ou ambiguë ; corrigez l’intervention avant le transfert.`);
      return `${observation ? observationNumber(report, rows[0]) + ' · ' : ''}${rows[0][field] || 'Sans intitulé'}`;
    }).join('\n');
  };
  const tasks = selected.map(action => {
    if (!action.id || d.actions.filter(row => row.id === action.id).length !== 1) throw new Error('Un identifiant d’intervention est absent ou dupliqué. Conservez le JSON et corrigez les références.');
    if (!action.intitule.trim() || !ACTION_CATEGORIES.includes(action.categorie)) throw new Error('Précisez l’intitulé et la nature de chaque intervention sélectionnée.');
    const estimate = action.planning_projet;
    if (!periods && !estimate.charge?.trim()) throw new Error(`Renseignez la charge estimée pour « ${action.intitule} ».`);
    if (periods && (!estimate.periode_debut || !estimate.duree_periodes)) throw new Error(`Renseignez le début et la durée en périodes pour « ${action.intitule} ».`);
    const description = [
      ['Dossier Rapport', report.reference_dossier || report.titre || 'Référence non renseignée'],
      ['Intervention source', String(d.actions.indexOf(action) + 1)],
      ['Nature', action.categorie], ['Priorité proposée', action.priorite], ['Horizon indiqué dans Rapport', action.horizon],
      ['Constats concernés', names(observationRefs, action.observation_ids, 'titre', 'constat', true)],
      ['Attentes concernées', names(d.attentes, action.attente_ids, 'libelle', 'attente')],
      ['Modalités de réalisation', action.realisation], ['Préalables et contraintes', action.prealables],
    ].filter(([, value]) => typeof value === 'string' && value.trim()).map(([label, value]) => `${label} : ${value}`).join('\n\n');
    if (description.length > 12000) throw new Error(`Les informations de « ${action.intitule} » dépassent la capacité d’une fiche Projet (12 000 caractères). Réduisez-les avant le transfert.`);
    // IDs belong to the independent exported project. Report IDs remain untouched.
    return { id: `I${String(d.actions.indexOf(action) + 1).padStart(3, '0')}`, name: action.intitule, lot: action.categorie,
      ...(periods ? {periodStart:Number(estimate.periode_debut),periodDuration:Number(estimate.duree_periodes)} : {}),
      description, duration: estimate.charge?.trim() ? planning.parseNumber(estimate.charge, 'Charge estimée', { min: Number.MIN_VALUE, max: 3650 }) : 0,
      dependencies: [], owner: estimate.responsable || '', status: 'À faire', progress: 0,
      checklist: [], risks: [], riskWeight: 'Mineur', riskStatus: 'Aucun', isMilestone: false, manualStart: periods ? null : estimate.debut_minimal || null };
  });
  const project = planning.normalizeProject({ schemaVersion: 1, ...(periods ? {timelineMode:'periods'} : {}), name: settings.titre, startDate: periods ? null : settings.date_debut,
    targetDate: periods ? null : settings.date_cible || null, capacityPerWeek: periods ? 5 : planning.parseNumber(settings.capacite_semaine, 'Capacité hebdomadaire', { min: Number.MIN_VALUE, max: 3650 }), schedulingMode: periods ? 'dependencies' : 'sequential', tasks });
  return { project, schedule: planning.schedule(project, periods ? undefined : settings.date_debut), json: planning.encodeProject(project) };
}
