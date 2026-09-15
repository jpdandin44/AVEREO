import { validLocation } from './locationMap.js';

export const DIRECTIONS = [
  ['N', 'Nord', 0], ['NE', 'Nord-est', 45], ['E', 'Est', 90], ['SE', 'Sud-est', 135],
  ['S', 'Sud', 180], ['SO', 'Sud-ouest', 225], ['O', 'Ouest', 270], ['NO', 'Nord-ouest', 315],
];
export const emptyTerrain = () => ({ analysis: null, facade: '', orientation: '', notes: '' });

export function normalizeStoredTerrain(value, lon, lat) {
  const result = emptyTerrain();
  for (const key of ['facade', 'notes']) if (typeof value?.[key] === 'string') result[key] = value[key];
  if (DIRECTIONS.some(([key]) => key === value?.orientation)) result.orientation = value.orientation;
  const analysis = value?.analysis;
  if (!analysis?.fetchedAt || !Number.isFinite(Date.parse(analysis.fetchedAt))) return result;
  try {
    const points = terrainGrid(lon, lat, analysis.width);
    result.analysis = summarizeTerrain({ elevations: analysis.samples }, points, analysis.width, analysis.fetchedAt);
  } catch { /* Invalid imported measurements must not become a terrain assessment. */ }
  return result;
}

// A small geographic grid, not the boundary of the cadastral parcel.
export function terrainGrid(lon, lat, width = 50) {
  if (!validLocation(lon, lat) || Math.abs(Number(lat)) > 80 || ![50, 100].includes(width)) throw new Error('Emprise invalide');
  const step = width / 2;
  const labels = ['NO', 'N', 'NE', 'O', 'Centre', 'E', 'SO', 'S', 'SE'];
  return [1, 0, -1].flatMap((north, row) => [-1, 0, 1].map((east, col) => ({
    label: labels[row * 3 + col], east: east * step, north: north * step,
    lon: Number((Number(lon) + east * step / (111320 * Math.cos(Number(lat) * Math.PI / 180))).toFixed(7)),
    lat: Number((Number(lat) + north * step / 111320).toFixed(7)),
  })));
}

export function elevationUrl(points) {
  if (!Array.isArray(points) || points.length !== 9 || points.some((p) => !validLocation(p.lon, p.lat))) throw new Error('Points invalides');
  const url = new URL('https://data.geopf.fr/altimetrie/1.0/calcul/alti/rest/elevation.json');
  url.search = new URLSearchParams({
    lon: points.map((p) => p.lon).join('|'), lat: points.map((p) => p.lat).join('|'),
    resource: 'ign_rge_alti_wld', delimiter: '|', zonly: 'false', measures: 'false',
  }).toString();
  return url.toString();
}

export function summarizeTerrain(payload, points, width, fetchedAt = new Date().toISOString()) {
  if (!Array.isArray(payload?.elevations) || payload.elevations.length !== 9 || points.length !== 9) throw new Error('Altitudes incomplètes');
  const samples = points.map((point, index) => {
    const value = payload.elevations[index];
    if (typeof value?.z !== 'number' || !Number.isFinite(value.z) || value.z === -99999
      || !validLocation(value.lon, value.lat)
      || Math.abs(Number(value.lon) - point.lon) > 0.00001 || Math.abs(Number(value.lat) - point.lat) > 0.00001) {
      throw new Error('Couverture altimétrique incomplète ou réponse incohérente');
    }
    return { ...point, z: value.z };
  });
  const min = Math.min(...samples.map((p) => p.z));
  const max = Math.max(...samples.map((p) => p.z));
  const center = samples[4];
  const slopes = samples.filter((p) => p.label !== 'Centre')
    .map((p) => ({ direction: p.label, percent: (center.z - p.z) / Math.hypot(p.east, p.north) * 100 }))
    .sort((a, b) => b.percent - a.percent);
  return { source: 'IGN RGE ALTI', fetchedAt, width, lon: center.lon, lat: center.lat,
    samples, min, max, range: max - min, descent: slopes[0].percent > 0 ? slopes[0] : null };
}

export async function fetchTerrain(lon, lat, width, signal) {
  const points = terrainGrid(lon, lat, width);
  const response = await fetch(elevationUrl(points), { signal, referrerPolicy: 'no-referrer' });
  if (!response.ok) throw new Error('Service IGN indisponible');
  return summarizeTerrain(await response.json(), points, width);
}

// Only measured, validated positions for this visit may be drawn on the map.
export function terrainMapSamples(analysis, lon, lat) {
  const valid = normalizeStoredTerrain({ analysis }, lon, lat).analysis;
  if (!valid) return [];
  return valid.samples.map((sample) => ({
    ...sample,
    level: valid.range === 0 ? 'neutral' : sample.z === valid.min ? 'low' : sample.z === valid.max ? 'high' : 'neutral',
  }));
}
