import { DEFAULT_CATEGORY, LEGACY_DEFAULT_CATEGORY, REPORT_CATEGORIES, defaultReportTitle } from './reportClassification.js';

export const TECHNICAL_STEPS = ['Mission', 'Constats', 'Rapport'];
export function technicalTypeLabel(value) {
  return ({ '': 'À préciser', 'Constat general': 'Constat général', Humidite: 'Humidité',
    'Evaluation Energétique': 'Évaluation énergétique', cartographie: 'Cartographie', pathologies: 'Pathologies' })[value] || value;
}
export function technicalReportTypes(current = '') {
  const definition = REPORT_CATEGORIES[DEFAULT_CATEGORY];
  return [...new Set(['', ...definition.legacySubcategories, ...definition.subcategories, ...(current ? [current] : [])])]
    .map(value => ({ value, label: technicalTypeLabel(value) }));
}
export function isTechnicalReport(report) {
  return [DEFAULT_CATEGORY, LEGACY_DEFAULT_CATEGORY].includes(report?.categorie);
}
export function hasTechnicalMission(report) {
  return isTechnicalReport(report) && Boolean(report.mission_technique && typeof report.mission_technique === 'object' && !Array.isArray(report.mission_technique));
}
// Only the authenticated server response grants this capability, never a mission profile.
export function canCreateTechnicalReport(user) {
  return user?.reportCapabilities?.technicalReport === true;
}
export function newTechnicalReport(report) {
  return { ...report, categorie: DEFAULT_CATEGORY, sous_categorie: '', profil_metier: '',
    titre: defaultReportTitle(DEFAULT_CATEGORY), mission_technique: { objet: '', perimetre: '', limites: '' } };
}
export function technicalMission(report) {
  const value = report?.mission_technique;
  return Object.fromEntries(['objet', 'perimetre', 'limites'].map(key => [key, typeof value?.[key] === 'string' ? value[key] : '']));
}
