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

function pause(milliseconds, signal) {
  return new Promise((resolve, reject) => {
    signal?.throwIfAborted();
    const abort = () => { clearTimeout(timer); reject(signal.reason); };
    const timer = setTimeout(() => { signal?.removeEventListener('abort', abort); resolve(); }, milliseconds);
    signal?.addEventListener('abort', abort, { once: true });
  });
}

// Three attempts at most, spaced beyond the official one-request/second limit.
// Only transient transport/HTTP failures are retried; invalid data never means zero risks.
export async function fetchGeorisquesRiskPayload(longitude, latitude, {
  signal, fetchImpl = globalThis.fetch, wait = pause,
} = {}) {
  const url = buildGeorisquesRiskSummaryUrl(longitude, latitude);
  if (!url) throw new Error('Coordonnées Géorisques invalides.');
  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    signal?.throwIfAborted();
    const controller = new AbortController();
    const abort = () => controller.abort(signal.reason);
    signal?.addEventListener('abort', abort, { once: true });
    const timeout = setTimeout(() => controller.abort(), 8000);
    let delay = 1200 * (attempt + 1);
    let retry = true;
    try {
      const response = await fetchImpl(url, { signal: controller.signal, referrerPolicy: 'no-referrer' });
      if (!response.ok) {
        retry = response.status === 429 || response.status >= 500;
        const retryAfter = response.headers?.get('retry-after');
        if (retryAfter) {
          const seconds = Number(retryAfter);
          const requested = Number.isFinite(seconds) ? seconds * 1000 : Date.parse(retryAfter) - Date.now();
          // A longer provider cooldown is left to an explicit later attempt, never shortened.
          if (requested > 3600) retry = false;
          else if (Number.isFinite(requested)) delay = Math.max(delay, requested);
        }
        throw new Error(`Géorisques : réponse HTTP ${response.status}.`);
      }
      retry = false;
      const payload = await response.json();
      const fetchedAt = new Date().toISOString();
      normalizeGeorisquesRiskSummary(payload, fetchedAt);
      signal?.throwIfAborted();
      return { payload, fetchedAt };
    } catch (error) {
      signal?.throwIfAborted();
      if (!retry) throw error;
      lastError = error;
    } finally {
      clearTimeout(timeout);
      signal?.removeEventListener('abort', abort);
    }
    if (attempt < 2) await wait(delay, signal);
  }
  throw lastError;
}

export function previousRisksAtPoint(report, longitude, latitude) {
  const point = report?.cadastre;
  return validLocation(point?.lon, point?.lat)
    && Number(point.lon) === Number(longitude) && Number(point.lat) === Number(latitude)
    && report.risques?.fetchedAt
    ? report.risques : emptyGeorisquesRiskSummary();
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

export function isRgaRisk(risk = {}) {
  const text = `${risk.key || ''} ${risk.label || ''}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  return /\brga\b|argile|retrait.gonflement/.test(text);
}

export function rgaRisk(summary = {}) {
  return summary.rga || (summary.naturels || []).find(isRgaRisk) || null;
}

function normalizeRga(group = {}) {
  const entry = Object.entries(group).find(([key, risk]) => isRgaRisk({ key, label: risk?.libelle }));
  if (!entry) return null;
  const [key, risk] = entry;
  return {
    key, label: String(risk?.libelle || 'Retrait-gonflement des argiles (RGA)'),
    addressStatus: String(risk?.libelleStatutAdresse || 'Information non disponible'),
    communeStatus: String(risk?.libelleStatutCommune || 'Information non disponible'),
  };
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
    rga: normalizeRga(payload.risquesNaturels),
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
