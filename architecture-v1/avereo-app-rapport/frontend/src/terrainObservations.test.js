import test from 'node:test';
import assert from 'node:assert/strict';
import { orderedObservations, observationNumber, moveObservation } from './observationOrder.js';
import { markersForPlan, planPayloadError } from './observationPlans.js';
import { mergeHabitologieProtocolState, setHabitologieStageEnabled, isHabitologieControlSelected, visitProtocolStages, protocolStageNumber } from './habitologieProtocol.js';
import { buildReportHtml } from './reportDelivery.js';
import { createTestReportCopy } from './testReportCopy.js';
import { captureTarget, attachCadastralPlan, cadastralTiles } from './cadastralCapture.js';

const plan = () => ({ id: 'cadastre-1', title: 'Terrain fictif', kind: 'cadastre', source: 'Fond de recette',
  width: 10, height: 10, src: 'data:image/png;base64,AAAA', cadrage: { zoom: 19, capturedAt: '2026-11-14T19:00:00Z' } });
const report = () => ({ profil_metier: 'habitologue', categorie: 'Visite Globale', meteo: {}, cadastre: {}, risques: {}, urbanisme: {},
  titre: 'Recette terrain', reference_dossier: 'FICTIF', proprietaire: 'Habitant fictif', adresse_logement: 'Lieu fictif',
  observations: [
    { id: 'f', phase_habitologie: 'feu', titre: 'Chauffage', observations: 'Bâti conservé', actions: '', photos: [] },
    { id: 't-a', phase_habitologie: 'terrain', titre: 'Accès', observations: 'Constat extérieur A', actions: '', photos: [], reperes: [{ planId: 'cadastre-1', x: .2, y: .3 }] },
    { id: 'e', phase_habitologie: 'eau', titre: 'Eau', observations: 'Eau conservée', actions: '', photos: [] },
    { id: 't-b', phase_habitologie: 'terrain', titre: 'Pente', observations: 'Constat extérieur B', actions: '', photos: [] },
    { id: 'old', titre: 'Ancien', observations: 'À classer', actions: '', photos: [] },
  ], plans: [plan()], habitologie_protocoles: {}, livrable: { audience: 'expert', observations: ['t-a', 'e', 'f'] },
  contexte_exterieur: { id: 'ancien-contexte', constat: 'Notes antérieures conservées', includeInClient: false } });

test('terrain T numbers never consume building numbers, including unassigned findings', () => {
  const r = report(), before = structuredClone(r);
  assert.deepEqual(orderedObservations(r).map(o => [o.id, observationNumber(r, o)]), [['t-a', 'T1'], ['t-b', 'T2'], ['e', 1], ['f', 2], ['old', 3]]);
  const without = { ...r, observations: r.observations.filter(o => o.phase_habitologie !== 'terrain') };
  for (const o of without.observations) assert.equal(observationNumber(r, o), observationNumber(without, o));
  assert.deepEqual(markersForPlan(r, 'cadastre-1').map(m => m.number), ['T1']);
  assert.deepEqual(r, before);
});

test('terrain reorder stays in its group and preserves building records and identifiers', () => {
  const r = report(), next = moveObservation(r, 't-b', 't-a');
  assert.equal(moveObservation(r, 't-a', 'e'), r);
  assert.equal(observationNumber(next, r.observations[3]), 'T1');
  assert.equal(observationNumber(next, r.observations[0]), 2);
  assert.equal(next.plans, r.plans); assert.equal(next.contexte_exterieur, r.contexte_exterieur);
  assert.deepEqual(next.observations.filter(o => o.phase_habitologie !== 'terrain'), r.observations.filter(o => o.phase_habitologie !== 'terrain'));
});

test('expert and selected client findings use the same T and building labels, no silent extra selection', () => {
  const r = report(), expert = buildReportHtml(r);
  assert.match(expert, /T1\. Accès/); assert.match(expert, /T2\. Pente/); assert.match(expert, /1\. Eau/); assert.match(expert, /2\. Chauffage/);
  assert.match(expert, /Bloc 0 - Le terrain de la propriété/); assert.match(expert, /Phase 1 - Eau/);
  assert.match(expert, /Notes antérieures conservées/);
  r.livrable.audience = 'client'; const client = buildReportHtml(r);
  assert.match(client, /Observation T1 · Accès/); assert.match(client, /Observation 1 · Eau/); assert.match(client, /Observation 2 · Chauffage/);
  assert.doesNotMatch(client, /Constat extérieur B|Notes antérieures conservées/);
  assert.deepEqual(r.livrable.observations, ['t-a', 'e', 'f']);
});

test('terrain protocol choices survive reload and suspension without changing data or building choices', () => {
  const r = report(); r.habitologie_protocoles = { terrain: { enabled: true, controls: { acces_abords: true } }, eau: { controls: { humidite: true } } };
  const next = setHabitologieStageEnabled(r, 'terrain', false);
  const restored = setHabitologieStageEnabled({ ...next, habitologie_protocoles: mergeHabitologieProtocolState(JSON.parse(JSON.stringify(next.habitologie_protocoles))) }, 'terrain', true);
  assert.equal(isHabitologieControlSelected(restored, 'terrain', 'acces_abords'), true);
  assert.equal(isHabitologieControlSelected(restored, 'eau', 'humidite'), true);
  assert.equal(next.observations, r.observations);
  assert.deepEqual(visitProtocolStages(r).map(protocolStageNumber), [0, 1, 2, 3, 4]);
});

test('test structure retains only terrain catalogue choices and excludes cadastral/private data', () => {
  const r = report(); r.habitologie_protocoles.terrain = { controls: { acces_abords: true, privateField: 'secret' } };
  const copy = createTestReportCopy(r), json = JSON.stringify(copy);
  assert.equal(copy.observations.find(o => o.phase_habitologie === 'terrain').phase_habitologie, 'terrain');
  assert.deepEqual(copy.habitologie_protocoles.terrain.controls, { acces_abords: true });
  assert.doesNotMatch(json, /AAAA|cadastre-1|Notes antérieures|Constat extérieur|secret/);
});

test('cadastral tile framing keeps visible offsets and never requests a nonexistent zoom-20 matrix', () => {
  const tiles = cadastralTiles({ width: 256, height: 256, zoom: 19, pixelOrigin: { x: 25600 + 64, y: 25600 + 128 } });
  assert.equal(tiles.length, 8); assert.deepEqual([tiles[0].x, tiles[0].y, tiles[0].size], [-64, -128, 256]);
  assert.ok(tiles.every(tile => tile.url.startsWith('https://data.geopf.fr/wmts?')));
  const overzoom = cadastralTiles({ width: 256, height: 256, zoom: 20, pixelOrigin: { x: 51200, y: 51200 } });
  assert.equal(overzoom[0].size, 512); assert.match(overzoom[0].url, /TILEMATRIX=19&TILEROW=100&TILECOL=100$/);
  assert.ok(!tiles.some(tile => /FICTIF|adresse|client|report/i.test(tile.url)));
});

test('capture rejects unbounded or invalid framing before any network or image work', () => {
  const view = { width: 700, height: 400, zoom: 18, pixelOrigin: { x: 100000, y: 100000 } };
  for (const patch of [{ width: 2001 }, { height: 0 }, { zoom: 21 }, { zoom: 18.5 }, { pixelOrigin: { x: NaN, y: 1 } }, { pixelOrigin: { x: -10, y: 0 } }]) {
    assert.throws(() => cadastralTiles({ ...view, ...patch }));
  }
});

test('new cadastral background preserves old markers and cannot attach after a dossier change', () => {
  const r = report(), target = captureTarget(r), p = { ...plan(), id: 'new-view' };
  const next = attachCadastralPlan(r, p, target);
  assert.equal(next.plans.length, 2); assert.equal(next.plans[0], r.plans[0]); assert.equal(next.observations, r.observations);
  assert.equal(planPayloadError(next), null); assert.deepEqual(JSON.parse(JSON.stringify(next)).plans[1].cadrage, p.cadrage);
  assert.equal(attachCadastralPlan(next, p, target), next);
  const other = { ...r, reference_dossier: 'AUTRE' }; assert.equal(attachCadastralPlan(other, p, target), other);
  assert.throws(() => attachCadastralPlan(r, { ...p, src: 'https://example.org/plan.png' }, target));
});
