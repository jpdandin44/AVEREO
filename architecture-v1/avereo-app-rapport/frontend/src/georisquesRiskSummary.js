const GEORISQUES_RISK_ENDPOINT = 'https://www.georisques.gouv.fr/api/v1/resultats_rapport_risque';
import { validLocation } from './locationMap.js';

export function safeGeorisquesReportUrl(value) {
  try {
    const url = new URL(String(value || ''));
    if (url.protocol !== 'https:' || !['georisques.gouv.fr', 'www.georisques.gouv.fr'].includes(url.hostname)) return '';
    return url.toString();
  } catch {
    return '';
  }
}

export function buildGeorisquesRiskSummaryUrl(longitude, latitude) {
  if (!validLocation(longitude, latitude)) return null;
  if (longitude === null || latitude === null || String(longitude).trim() === '' || String(latitude).trim() === '') {
    return null;
  }
  const lon = Number(longitude);
  const lat = Number(latitude);
  if (!Number.isFinite(lon) || !Number.isFinite(lat) || lon < -180 || lon > 180 || lat < -90 || lat > 90) {
    return null;
  }
  const url = new URL(GEORISQUES_RISK_ENDPOINT);
  url.searchParams.set('latlon', `${longitude},${latitude}`);
  return url.toString();
}

function normalizeRiskGroup(group = {}) {
  return Object.entries(group)
    .filter(([, risk]) => risk?.present === true)
    .map(([key, risk]) => ({
      key,
      label: String(risk.libelle || key),
      addressStatus: String(risk.libelleStatutAdresse || 'Information non disponible'),
      communeStatus: String(risk.libelleStatutCommune || 'Information non disponible'),
    }));
}

export function normalizeGeorisquesRiskSummary(payload = {}, fetchedAt = new Date().toISOString()) {
  const isGroup = (value) => value && typeof value === 'object' && !Array.isArray(value);
  if (fetchedAt && (!isGroup(payload?.risquesNaturels) || !isGroup(payload?.risquesTechnologiques))) {
    throw new Error('Synthèse Géorisques invalide ou incomplète');
  }
  return {
    source: 'Géorisques API V1',
    fetchedAt,
    reportUrl: safeGeorisquesReportUrl(payload.url),
    addressLabel: typeof payload.adresse?.libelle === 'string' ? payload.adresse.libelle : '',
    communeLabel: typeof payload.commune?.libelle === 'string' ? payload.commune.libelle : '',
    naturels: normalizeRiskGroup(payload.risquesNaturels),
    technologiques: normalizeRiskGroup(payload.risquesTechnologiques),
  };
}

export function emptyGeorisquesRiskSummary() {
  return normalizeGeorisquesRiskSummary({}, '');
}

export function riskStatusTone(status = '') {
  const normalized = status.toLocaleLowerCase('fr-FR');
  if (normalized.includes('non connu') || normalized.includes('non concerne') || normalized.includes('non concerné')) {
    return 'neutral';
  }
  if (normalized.includes('faible')) return 'low';
  if (normalized.includes('modere') || normalized.includes('modéré')) return 'medium';
  if (normalized.includes('important') || normalized.includes('existant') || normalized.includes('concerne')) return 'high';
  return 'neutral';
}
