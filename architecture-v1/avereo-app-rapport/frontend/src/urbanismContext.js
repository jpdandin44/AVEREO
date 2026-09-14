import { validLocation } from './locationMap.js';

export const URBAN_LAYERS = [
  ['zone-urba', 'Zonage'], ['prescription-surf', 'Prescriptions surfaciques'],
  ['prescription-lin', 'Prescriptions linéaires'], ['prescription-pct', 'Prescriptions ponctuelles'],
  ['assiette-sup-s', 'Servitudes surfaciques'],
];

export function safeDocumentUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password ? url.toString() : '';
  } catch { return ''; }
}

export function urbanismUrl(layer, lon, lat) {
  if (!URBAN_LAYERS.some(([key]) => key === layer) || !validLocation(lon, lat)) throw new Error('Requête urbanisme invalide');
  const url = new URL('https://apicarto.ign.fr/api/gpu/' + layer);
  url.searchParams.set('geom', JSON.stringify({ type: 'Point', coordinates: [Number(lon), Number(lat)] }));
  return url.toString();
}

const label = (value) => typeof value === 'string' ? value.slice(0, 2000) : '';
export function normalizeUrbanLayer(payload, layer) {
  if (!Array.isArray(payload?.features)) throw new Error('Réponse urbanisme invalide');
  const items = payload.features.map((feature, index) => {
    const p = feature.properties || {};
    return {
      id: String(p.gid ?? index),
      title: label(p.libelle || p.typeass || p.suptype) || 'Libellé non fourni',
      detail: label(p.libelong || p.txt || p.nomsuplitt || p.nomass),
      code: label(p.suptype || p.typepsc), document: label(p.idurba || p.partition),
      url: safeDocumentUrl(p.urlfic || p.urlreg),
      sourceDate: label(p.datvalid || p.datappro || p.gpu_timestamp),
    };
  });
  return { layer, items, partial: Number(payload.totalFeatures) > items.length };
}

export async function fetchUrbanism(lon, lat, signal) {
  const results = await Promise.all(URBAN_LAYERS.map(async ([layer]) => {
    try {
      const response = await fetch(urbanismUrl(layer, lon, lat), { signal, referrerPolicy: 'no-referrer' });
      if (!response.ok) throw new Error('Service indisponible');
      return normalizeUrbanLayer(await response.json(), layer);
    } catch { return { layer, items: [], error: true }; }
  }));
  if (signal?.aborted || results.every((r) => r.error)) throw new Error('Urbanisme indisponible');
  return { source: 'IGN API Carto / Géoportail de l’urbanisme', fetchedAt: new Date().toISOString(),
    lon: Number(lon), lat: Number(lat), results };
}

export function normalizeStoredUrbanism(value, lon, lat) {
  if (!validLocation(value?.lon, value?.lat) || Number(value.lon) !== Number(lon) || Number(value.lat) !== Number(lat)
    || !Number.isFinite(Date.parse(value.fetchedAt)) || !Array.isArray(value.results)) return null;
  return { source: 'IGN API Carto / Géoportail de l’urbanisme', fetchedAt: value.fetchedAt,
    lon: Number(lon), lat: Number(lat), results: URBAN_LAYERS.map(([layer]) => {
      const group = value.results.find((r) => r?.layer === layer);
      if (!Array.isArray(group?.items) || group.error) return { layer, items: [], error: true };
      return { layer, partial: Boolean(group.partial), items: group.items.filter((item) => item && typeof item === 'object').map((item, index) => ({
        id: String(index), title: label(item.title), detail: label(item.detail), code: label(item.code),
        document: label(item.document), sourceDate: label(item.sourceDate), url: safeDocumentUrl(item.url),
      })) };
    }) };
}
