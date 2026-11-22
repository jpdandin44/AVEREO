import { orderedObservations, observationNumber } from './observationOrder.js';
import { REPORT_JSON_LIMIT } from '../../../avereo-platform/shared/report-volumes.js';

// Plans belong to the report payload. Never fetch a remote image or share case assets.
export const MAX_REPORT_BYTES = REPORT_JSON_LIMIT;
export const MAX_PLAN_BYTES = 4 * 1024 * 1024;
export const MAX_PLANS = 20;
export const PLAN_KINDS = Object.freeze({
  cadastre: 'Fond cadastral du terrain', satellite: 'Vue satellite — photographie aérienne',
  satellite_parcelles: 'Vue satellite + parcelles', masse: 'Plan de masse',
  niveau: 'Plan de niveau', coupe: 'Coupe', facade: 'Façade', autre: 'Autre vue',
});
export const planKindLabel = kind => PLAN_KINDS[kind] || 'Plan';
const imagePattern = /^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/;
const identifier = value => typeof value === 'string' && value.length > 0 && value.length <= 190;

export function planPayloadError(report) {
  const plans = report.plans ?? [];
  if (!Array.isArray(plans) || plans.length > MAX_PLANS) return 'La liste des plans est invalide (20 vues maximum).';
  const ids = new Set();
  for (const plan of plans) {
    if (!plan || !identifier(plan.id) || ids.has(plan.id)) return 'Chaque plan doit avoir un identifiant unique.';
    ids.add(plan.id);
    if (typeof plan.title !== 'string' || !plan.title.trim() || plan.title.length > 200
      || !Object.hasOwn(PLAN_KINDS, plan.kind)
      || typeof plan.source !== 'string' || plan.source.length > 1000) return 'Le titre, le type ou la source du plan est invalide.';
    if (typeof plan.src !== 'string' || !imagePattern.test(plan.src)
      || plan.src.length > Math.ceil(MAX_PLAN_BYTES / 3) * 4 + 32) return 'Chaque plan doit être une image PNG ou JPEG de 4 Mio maximum.';
    if (![plan.width, plan.height].every(n => Number.isInteger(n) && n > 0 && n <= 12000)
      || plan.width * plan.height > 24000000) return 'Dimensions de plan invalides (24 millions de pixels maximum).';
  }
  const observations = Array.isArray(report.observations) ? report.observations : [];
  const observationIds = new Set();
  for (const observation of observations) {
    if (plans.length && (!identifier(observation?.id) || observationIds.has(observation.id))) return 'Les observations repérées doivent avoir des identifiants uniques.';
    observationIds.add(observation?.id);
    const points = observation?.reperes ?? [];
    if (!Array.isArray(points) || points.length > MAX_PLANS) return 'La liste des repères est invalide.';
    const used = new Set();
    for (const point of points) {
      if (!point || !ids.has(point.planId) || used.has(point.planId)) return 'Un repère doit désigner une vue existante, une seule fois par observation.';
      if (![point.x, point.y].every(n => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 1)) return 'Un repère doit rester dans les limites du plan.';
      used.add(point.planId);
    }
  }
  return null;
}

// Numbers come from the shared protocol order, never from the stored array position.
export function markersForPlan(report, planId, selectedIds = null) {
  return orderedObservations(report).flatMap((observation) => {
    if (selectedIds && !selectedIds.includes(observation.id)) return [];
    const point = (observation.reperes || []).find(p => p.planId === planId);
    return point ? [{ ...point, observationId: observation.id, number: observationNumber(report, observation),
      title: observation.titre || observation.piece || 'Observation sans titre' }] : [];
  });
}

export function setObservationPoint(report, observationId, planId, point) {
  if (!(report.plans || []).some(p => p.id === planId)) return report;
  if (point && ![point.x, point.y].every(n => typeof n === 'number' && Number.isFinite(n))) return report;
  return { ...report, observations: report.observations.map(observation => observation.id !== observationId ? observation : {
    ...observation, reperes: [...(observation.reperes || []).filter(p => p.planId !== planId),
      ...(point ? [{ planId, x: Math.max(0, Math.min(1, point.x)), y: Math.max(0, Math.min(1, point.y)) }] : [])],
  }) };
}

export function observationPlanNames(report, observation) {
  return observationPlanViews(report, observation).map(plan => plan.title);
}

export function observationPlanViews(report, observation) {
  return (observation.reperes || []).map(point => (report.plans || []).find(plan => plan.id === point.planId)).filter(Boolean);
}

export function removePlan(report, planId) {
  if (!(report.plans || []).some(plan => plan.id === planId)) return report;
  return { ...report, plans: report.plans.filter(plan => plan.id !== planId),
    observations: report.observations.map(observation => !observation.reperes?.some(point => point.planId === planId) ? observation
      : { ...observation, reperes: observation.reperes.filter(point => point.planId !== planId) }) };
}

export async function readPlanFile(file, kind = 'auto') {
  if (!['image/png', 'image/jpeg'].includes(file.type) || file.size > MAX_PLAN_BYTES) {
    throw new Error('Choisir des images PNG ou JPEG de 4 Mio maximum chacune.');
  }
  const src = await new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Lecture du plan impossible.')); reader.readAsDataURL(file);
  });
  const image = new Image(); image.src = src;
  try { await image.decode(); } catch { throw new Error('Cette image ne peut pas être décodée.'); }
  const plan = { id: crypto.randomUUID(), title: file.name.replace(/\.[^.]+$/, ''),
    kind: kind === 'auto' ? inferPlanKind(file.name) : kind, source: file.name, src,
    width: image.naturalWidth, height: image.naturalHeight };
  const error = planPayloadError({ plans: [plan] });
  if (error) throw new Error(error);
  return plan;
}

export function inferPlanKind(name) {
  const value = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  if (/satellite|aerien|orthophoto/.test(value)) return /parcell/.test(value) ? 'satellite_parcelles' : 'satellite';
  if (/cadastr/.test(value)) return 'cadastre';
  if (/coupe/.test(value)) return 'coupe';
  if (/facade|elevation/.test(value)) return 'facade';
  if (/masse/.test(value)) return 'masse';
  return 'niveau';
}

// Bake the same coordinates and observation numbers into a PNG for native Word.
// The source in the dossier stays intact; this image is only an export derivative.
export async function annotatedPlanImage(plan, markers) {
  const image = new Image(); image.src = plan.src;
  await image.decode();
  if (image.naturalWidth !== plan.width || image.naturalHeight !== plan.height) throw new Error(`Dimensions incohérentes pour ${plan.title}.`);
  const scale = Math.min(1, 2000 / image.naturalWidth, 2000 / image.naturalHeight);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(image.naturalWidth * scale); canvas.height = Math.round(image.naturalHeight * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Le navigateur ne peut pas dessiner les repères.');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
  const displayScale = Math.min(570 / canvas.width, 510 / canvas.height, 1);
  const radius = 12 / displayScale;
  for (const marker of markers) {
    const x = marker.x * canvas.width, y = marker.y * canvas.height;
    const labelX = Math.max(radius + 3, Math.min(canvas.width - radius - 3, x));
    const labelY = Math.max(radius + 3, Math.min(canvas.height - radius - 3, y));
    ctx.strokeStyle = '#002b45'; ctx.lineWidth = 2 / displayScale;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(labelX, labelY); ctx.stroke();
    ctx.beginPath(); ctx.arc(labelX, labelY, radius, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#002b45'; ctx.font = `bold ${12 / displayScale}px Arial`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(String(marker.number), labelX, labelY);
  }
  return canvas.toDataURL('image/png');
}
