import { validLocation } from './locationMap.js';
import { normalizeGeorisquesRiskSummary } from './georisquesRiskSummary.js';

export const RGA_MESSAGE = 'avereo.rga.context.v1';
export const RGA_TRANSFER_KEY = 'avereo.rga.transfer.v1';
export const rgaLevelLabel = level => ({ Faible: 'faible', Moyen: 'moyenne', Fort: 'forte' }[level] || 'non disponible');

export function normalizeRgaCartography(value, lon, lat) {
  if (!value || !validLocation(lon, lat) || !validLocation(value.lon, value.lat) || Number(value.lon) !== Number(lon) || Number(value.lat) !== Number(lat)
    || !['available', 'not_classified', 'outside_coverage'].includes(value.status)
    || !['', 'Faible', 'Moyen', 'Fort'].includes(value.level)
    || (value.status === 'available') !== Boolean(value.level)
    || value.dataset !== 'AleaRG_2025_Fxx_L93.shp' || value.millesime !== '2026'
    || typeof value.department !== 'string' || !/^(?:\d{2}|2A|2B)?$/.test(value.department)
    || !Number.isFinite(Date.parse(value.fetchedAt)) || Date.parse(value.fetchedAt) > Date.now() + 60000) return null;
  return { lon: Number(lon), lat: Number(lat), status: value.status, level: value.level,
    department: value.department, dataset: value.dataset, millesime: '2026', fetchedAt: value.fetchedAt,
    source: 'Géorisques / BRGM — carte AVEREO 2026',
    limitation: 'Lecture indicative de contours simplifiés à 20 m sur une grille de 10 m. Ne vaut ni qualification parcellaire, ni étude géotechnique. Une zone non classée ne signifie pas absence de risque.' };
}

export function buildRgaMapUrl(report = {}) {
  const { lon, lat } = report.cadastre || {};
  if (!validLocation(lon, lat)) return '/rga/carte.php';
  const params = new URLSearchParams({ mode: 'rapport', lon: String(Number(lon)), lat: String(Number(lat)),
    adresse: String(report.localisation?.adresse_trouvee || report.adresse_logement || '').slice(0, 500) });
  return `/rga/carte.php#${params}`;
}

export function readRgaTransfer(value) {
  try {
    if (typeof value !== 'string' || value.length > 250000) return null;
    const { message, label } = JSON.parse(value);
    if (typeof label !== 'string' || !label.trim() || label.length > 500) return null;
    const report = { adresse_logement: label, cadastre: { lon: message?.lon, lat: message?.lat },
      localisation: { adresse_trouvee: label, confirmation: null } };
    return applyRgaContext(report, message);
  } catch { return null; }
}

// A received result can update risks only for the point currently being examined.
// It never moves the property or imports data from another dossier.
export function applyRgaContext(report, message) {
  if (message?.type !== RGA_MESSAGE || !validLocation(message.lon, message.lat)
    || !validLocation(report.cadastre?.lon, report.cadastre?.lat)
    || Number(message.lon) !== Number(report.cadastre.lon)
    || Number(message.lat) !== Number(report.cadastre.lat)) return null;
  const reading = normalizeRgaCartography(message.cartography, message.lon, message.lat);
  const cartography = reading && !(Date.parse(reading.fetchedAt) < Date.parse(report.rga_cartographie?.fetchedAt)) ? reading : null;
  let updated = cartography ? { ...report, rga_cartographie: cartography } : null;
  if (!message.payload) return updated;
  const date = Date.parse(message.fetchedAt);
  if (!Number.isFinite(date) || date > Date.now() + 60000) return updated;
  if (report.risques?.fetchedAt && date < Date.parse(report.risques.fetchedAt)) return updated;
  try {
    const risques = normalizeGeorisquesRiskSummary(message.payload, new Date(date).toISOString());
    return { ...(updated || report), risques };
  } catch { return updated; }
}

// EPSG:2154, GRS80. Used only to position the marker on the supplied display map.
export function lambert93(lon, lat) {
  if (!validLocation(lon, lat)) return null;
  const rad = Math.PI / 180, e = Math.sqrt(0.00669438002290);
  const m = p => Math.cos(p) / Math.sqrt(1 - e * e * Math.sin(p) ** 2);
  const t = p => Math.tan(Math.PI / 4 - p / 2) / ((1 - e * Math.sin(p)) / (1 + e * Math.sin(p))) ** (e / 2);
  const p1 = 44 * rad, p2 = 49 * rad;
  const n = Math.log(m(p1) / m(p2)) / Math.log(t(p1) / t(p2));
  const F = m(p1) / (n * t(p1) ** n);
  const r0 = 6378137 * F * t(46.5 * rad) ** n;
  const r = 6378137 * F * t(Number(lat) * rad) ** n, theta = n * (Number(lon) - 3) * rad;
  return [700000 + r * Math.sin(theta), 6600000 + r0 - r * Math.cos(theta)];
}
