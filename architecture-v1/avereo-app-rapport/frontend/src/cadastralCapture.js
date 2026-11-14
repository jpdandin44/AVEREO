import { buildIgnTileUrl, validLocation } from './locationMap.js';
import { MAX_PLANS, MAX_REPORT_BYTES, planPayloadError } from './observationPlans.js';

export const CADASTRAL_SOURCE = '© IGN / DGFiP — Plan IGN et Parcellaire Express (PCI)';
export const captureTarget = report => JSON.stringify([report.onlineReportId || '', report.reference_dossier,
  report.adresse_logement, report.cadastre?.lon, report.cadastre?.lat]);

// Positions are in the same global Web Mercator pixels as the visible Leaflet map.
export function cadastralTiles(view) {
  const { width, height, zoom, pixelOrigin } = view;
  if (![width, height, zoom].every(Number.isInteger) || width < 1 || width > 2000 || height < 1 || height > 1200
    || zoom < 3 || zoom > 20 || !pixelOrigin || ![pixelOrigin.x, pixelOrigin.y].every(Number.isFinite)) {
    throw new Error('Cadrage cadastral invalide. Réduisez la taille de la carte et réessayez.');
  }
  const nativeZoom = Math.min(19, zoom), scale = 2 ** (zoom - nativeZoom), size = 256 * scale;
  const jobs = [];
  for (const layer of ['plan', 'cadastre']) {
    for (let y = Math.floor(pixelOrigin.y / size); y <= Math.floor((pixelOrigin.y + height - 1) / size); y++) {
      for (let x = Math.floor(pixelOrigin.x / size); x <= Math.floor((pixelOrigin.x + width - 1) / size); x++) {
        if (x < 0 || y < 0 || x >= 2 ** nativeZoom || y >= 2 ** nativeZoom) throw new Error('Ce cadrage sort des limites du fond cadastral.');
        jobs.push({ url: buildIgnTileUrl(layer).replace('{z}', nativeZoom).replace('{y}', y).replace('{x}', x),
          x: x * size - pixelOrigin.x, y: y * size - pixelOrigin.y, size });
      }
    }
  }
  if (jobs.length > 100) throw new Error('La vue est trop grande. Réduisez le cadrage.');
  return jobs;
}

export function attachCadastralPlan(report, plan, target) {
  if (captureTarget(report) !== target || (report.plans || []).some(item => item.id === plan.id)) return report;
  if ((report.plans || []).length >= MAX_PLANS) throw new Error('20 vues maximum par dossier.');
  const next = { ...report, plans: [...(report.plans || []), plan] };
  const error = planPayloadError(next);
  if (error) throw new Error(error);
  if (new Blob([JSON.stringify(next)]).size > MAX_REPORT_BYTES) throw new Error('Le dossier dépasse 50 Mio. La vue n’a pas été ajoutée.');
  return next;
}

export async function captureCadastralView(view, signal) {
  if (!validLocation(view.center?.lon, view.center?.lat)) throw new Error('Centre du cadrage invalide.');
  const jobs = cadastralTiles(view), canvas = document.createElement('canvas');
  canvas.width = view.width; canvas.height = view.height + 40;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Le navigateur ne peut pas enregistrer cette vue.');
  ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  // Bounded batches preserve the layer order and release every decoded bitmap on failure.
  for (let offset = 0; offset < jobs.length; offset += 4) {
    signal.throwIfAborted();
    const batch = jobs.slice(offset, offset + 4);
    const images = await Promise.allSettled(batch.map(async job => {
      const response = await fetch(job.url, { signal, mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer' });
      if (!response.ok || !response.headers.get('Content-Type')?.startsWith('image/')) throw new Error('Une tuile cadastrale est indisponible.');
      return createImageBitmap(await response.blob());
    }));
    try {
      const failed = images.find(item => item.status === 'rejected');
      if (failed) throw failed.reason;
      images.forEach((item, i) => ctx.drawImage(item.value, batch[i].x, batch[i].y, batch[i].size, batch[i].size));
    } finally { images.forEach(item => { if (item.status === 'fulfilled') item.value.close(); }); }
  }
  signal.throwIfAborted();
  ctx.fillStyle = '#fff'; ctx.fillRect(0, view.height, view.width, 40); ctx.fillRect(view.width - 42, 5, 36, 28);
  ctx.fillStyle = '#002b45'; ctx.font = 'bold 15px Arial'; ctx.fillText('N ↑', view.width - 38, 25);
  ctx.font = '11px Arial'; ctx.fillText(CADASTRAL_SOURCE, 8, view.height + 16, view.width - 16);
  const capturedAt = new Date().toISOString();
  ctx.fillText(`Vue enregistrée le ${capturedAt.slice(0, 10)} · repérage indicatif`, 8, view.height + 32, view.width - 16);
  return { id: crypto.randomUUID(), title: 'Terrain — fond cadastral', kind: 'cadastre',
    source: `${CADASTRAL_SOURCE} · vue enregistrée le ${capturedAt}`, src: canvas.toDataURL('image/png'),
    width: canvas.width, height: canvas.height,
    cadrage: { capturedAt, center: view.center, zoom: view.zoom, bounds: view.bounds } };
}
