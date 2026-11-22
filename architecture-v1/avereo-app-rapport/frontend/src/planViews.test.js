import test from 'node:test';
import assert from 'node:assert/strict';
import { PLAN_KINDS, inferPlanKind, markersForPlan, observationPlanViews, planPayloadError, removePlan, setObservationPoint } from './observationPlans.js';
import { attachPlanViews, cadastralTiles, captureCadastralView, captureTarget } from './cadastralCapture.js';
import { buildObservationPlansHtml } from './reportHtml.js';
import { moveObservation } from './observationOrder.js';

const image = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=';
const plan = (id, kind = 'niveau') => ({ id, title: id, kind, source: 'Recette fictive', width: 1, height: 1, src: image });
const report = () => ({ reference_dossier: 'TEST', categorie: 'Visite Globale', profil_metier: 'habitologue',
  plans: [plan('ancien'), plan('sat', 'satellite'), plan('mix', 'satellite_parcelles')],
  observations: [{ id: 'feu', phase_habitologie: 'feu', titre: 'Constat exclu', photos: [] },
    { id: 'eau', phase_habitologie: 'eau', titre: 'Constat retenu', photos: [] },
    { id: 'terrain', phase_habitologie: 'terrain', titre: 'Terrain', photos: [] }] });
const frame = { width: 256, height: 256, zoom: 19, pixelOrigin: { x: 25664, y: 25728 } };

test('three terrain backgrounds use the correct public layers at exactly the same framing', () => {
  const capture = mode => cadastralTiles({ ...frame, mode });
  const layers = mode => [...new Set(capture(mode).map(tile => new URL(tile.url).searchParams.get('LAYER')))];
  assert.deepEqual(layers('cadastre'), ['GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2', 'CADASTRALPARCELS.PARCELLAIRE_EXPRESS']);
  assert.deepEqual(layers('satellite'), ['ORTHOIMAGERY.ORTHOPHOTOS']);
  assert.deepEqual(layers('satellite_parcelles'), ['ORTHOIMAGERY.ORTHOPHOTOS', 'CADASTRALPARCELS.PARCELLAIRE_EXPRESS']);
  const positions = mode => capture(mode).slice(0, 4).map(({ x, y, size }) => [x, y, size]);
  assert.deepEqual(positions('satellite'), positions('cadastre'));
  assert.deepEqual(positions('satellite_parcelles'), positions('cadastre'));
  assert.deepEqual(cadastralTiles(frame), capture('cadastre'));
  assert.throws(() => capture('https://example.invalid/private'));
});

test('all new view types keep exact data through JSON, with a separate point per view', () => {
  let r = report();
  for (const [id, x, y] of [['ancien', .1, .2], ['sat', .3, .4], ['mix', .6, .7]]) r = setObservationPoint(r, 'terrain', id, { x, y });
  for (const kind of Object.keys(PLAN_KINDS)) assert.equal(planPayloadError({ ...r, plans: [...r.plans, plan('kind-' + kind, kind)] }), null);
  assert.deepEqual(JSON.parse(JSON.stringify(r)), r);
  assert.deepEqual(observationPlanViews(r, r.observations[2]).map(p => p.id), ['ancien', 'sat', 'mix']);
  assert.deepEqual(markersForPlan(r, 'sat').map(p => [p.number, p.x, p.y]), [['T1', .3, .4]]);
});

test('adding several views is atomic and cannot replace the dossier or its old backgrounds', () => {
  const r = report(), before = structuredClone(r), target = captureTarget(r);
  const pair = [plan('new-sat', 'satellite'), plan('new-cad', 'cadastre')];
  const next = attachPlanViews(r, pair, target);
  assert.equal(next.observations, r.observations); assert.equal(next.plans[0], r.plans[0]);
  assert.deepEqual(next.plans.slice(-2), pair);
  assert.equal(attachPlanViews(next, pair, target), next);
  assert.throws(() => attachPlanViews(r, [pair[0], { ...pair[1], src: 'https://example.invalid/plan.png' }], target));
  assert.throws(() => attachPlanViews({ ...r, plans: Array.from({ length: 19 }, (_, i) => plan('p' + i)) }, pair, target));
  const other = { ...r, reference_dossier: 'AUTRE' }; assert.equal(attachPlanViews(other, pair, target), other);
  assert.deepEqual(r, before);
});

test('removing one background removes only its points and never a finding, photograph or another view', () => {
  let r = setObservationPoint(report(), 'eau', 'sat', { x: .2, y: .5 });
  r = setObservationPoint(r, 'eau', 'mix', { x: .8, y: .9 });
  const before = structuredClone(r), next = removePlan(r, 'sat');
  assert.equal(next.observations.length, r.observations.length);
  assert.equal(next.observations[0], r.observations[0]);
  assert.deepEqual(next.observations[1], { ...r.observations[1], reperes: [{ planId: 'mix', x: .8, y: .9 }] });
  assert.deepEqual(next.plans.map(p => p.id), ['ancien', 'mix']);
  assert.equal(removePlan(r, 'missing'), r); assert.deepEqual(r, before);
});

test('protocol renumbering preserves satellite positions and client export excludes other findings', () => {
  let r = setObservationPoint(report(), 'feu', 'sat', { x: .1, y: .2 });
  r = setObservationPoint(r, 'eau', 'sat', { x: .7, y: .8 });
  const original = structuredClone(r.observations.map(o => [o.id, o.reperes]));
  r = moveObservation(r, 'feu', 'eau'); // Cross-phase movement remains refused.
  assert.deepEqual(r.observations.map(o => [o.id, o.reperes]), original);
  assert.deepEqual(markersForPlan(r, 'sat').map(p => [p.number, p.observationId]), [[1, 'eau'], [2, 'feu']]);
  const client = buildObservationPlansHtml(r, ['eau']);
  assert.match(client, /Vue satellite/); assert.match(client, /Observation 1/);
  assert.doesNotMatch(client, /Constat exclu|data-plan-id="mix"|data-plan-id="ancien"/);
  assert.match(client, /left:70%;top:80%/);
});

test('file naming suggests a type without changing existing imports or fetching a remote resource', () => {
  for (const [name, kind] of [['Coupe A-A.jpg', 'coupe'], ['Façade Sud.png', 'facade'], ['Plan de masse.png', 'masse'],
    ['Cadastre.png', 'cadastre'], ['Orthophoto.png', 'satellite'], ['Satellite + parcelles.jpg', 'satellite_parcelles'], ['R+1.png', 'niveau']]) {
    assert.equal(inferPlanKind(name), kind);
  }
  assert.ok(planPayloadError({ plans: [plan('bad', 'unknown')] }));
});

test('capture retries one intermittent tile error, retains layer order and releases every bitmap', async t => {
  const original = { document: globalThis.document, createImageBitmap: globalThis.createImageBitmap };
  t.after(() => { for (const [key, value] of Object.entries(original)) { if (value === undefined) delete globalThis[key]; else globalThis[key] = value; } });
  const draws = [], labels = [], closed = [], requests = [];
  globalThis.document = { createElement: () => ({ getContext: () => ({ fillRect() {}, fillText(text) { labels.push(text); }, drawImage(bitmap) { draws.push(bitmap.layer); } }), toDataURL: () => image }) };
  globalThis.createImageBitmap = async blob => ({ layer: blob.layer, close() { closed.push(blob.layer); } });
  let first = true;
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    const layer = new URL(url).searchParams.get('LAYER'); requests.push({ url, options });
    if (layer.includes('PLANIGN') && first) { first = false; return { ok: false, headers: { get: () => 'text/xml' } }; }
    return { ok: true, headers: { get: () => 'image/png' }, blob: async () => ({ layer }) };
  });
  const view = { width: 256, height: 256, zoom: 18, pixelOrigin: { x: 25600, y: 25600 }, center: { lon: 2.2945, lat: 48.8584 }, mode: 'cadastre' };
  const captured = await captureCadastralView(view, new AbortController().signal);
  assert.equal(requests.length, 3); assert.equal(requests.filter(r => r.options.cache === 'reload').length, 1);
  assert.ok(requests.every(r => r.options.credentials === 'omit'));
  assert.deepEqual(draws, ['GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2', 'CADASTRALPARCELS.PARCELLAIRE_EXPRESS']);
  assert.equal(closed.length, 2); assert.equal(captured.kind, 'cadastre'); assert.equal(captured.height, 296);
  assert.equal(captured.cadrage.mode, 'cadastre'); assert.ok(labels.some(text => text.includes('IGN')));
  t.mock.method(globalThis, 'fetch', async () => ({ ok: false, headers: { get: () => 'text/xml' } }));
  await assert.rejects(captureCadastralView(view, new AbortController().signal), /indisponible/);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(captureCadastralView(view, controller.signal), /abort/i);
});
