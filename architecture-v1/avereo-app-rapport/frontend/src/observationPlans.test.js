import test from 'node:test';
import assert from 'node:assert/strict';
import { markersForPlan, observationPlanNames, planPayloadError, setObservationPoint } from './observationPlans.js';
import { buildObservationPlansHtml } from './reportHtml.js';
import { buildReportHtml } from './reportDelivery.js';
import { moveObservation, orderedObservations } from './observationOrder.js';

const plan = (id = 'rdc') => ({ id, title: 'RDC <test>', kind: 'niveau', source: 'Plan fourni',
  width: 1, height: 1, src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/l9sAAAAASUVORK5CYII=' });
const dossier = () => ({ plans: [plan(), { ...plan('coupe'), kind: 'coupe' }],
  observations: [{ id: 'a', titre: 'Constat A', photos: [] }, { id: 'b', titre: 'Constat B', photos: [] }] });

test('old reports receive no plans, markers or case-specific data', () => {
  assert.equal(planPayloadError({ observations: [{ id: 'old' }] }), null);
  assert.equal(buildObservationPlansHtml({ observations: [] }), '');
});

test('one observation has the same number on level and section; edits and removal preserve the observation', () => {
  let report = dossier(), original = structuredClone(report);
  report = setObservationPoint(report, 'b', 'rdc', { x: .4, y: .6 });
  report = setObservationPoint(report, 'b', 'coupe', { x: .7, y: .2 });
  report = setObservationPoint(report, 'b', 'rdc', { x: .5, y: .3 });
  assert.equal(report.observations[1].reperes.length, 2);
  assert.equal(markersForPlan(report, 'rdc')[0].number, 2);
  assert.equal(markersForPlan(report, 'coupe')[0].number, 2);
  assert.equal(markersForPlan(report, 'rdc')[0].x, .5);
  assert.deepEqual(observationPlanNames(report, report.observations[1]), ['RDC <test>', 'RDC <test>']);
  const restored = JSON.parse(JSON.stringify(report));
  assert.deepEqual(restored, report);
  report = setObservationPoint(report, 'b', 'rdc', null);
  assert.equal(report.observations[1].reperes.length, 1);
  assert.equal(report.observations[1].titre, original.observations[1].titre);
  assert.equal(original.observations[1].reperes, undefined);
  assert.equal(planPayloadError(restored), null);
});

test('deletion and reordering keep the reference on the correct observation', () => {
  const report = setObservationPoint(dossier(), 'b', 'rdc', { x: 0, y: 1 });
  report.observations.reverse();
  assert.equal(markersForPlan(report, 'rdc')[0].number, 1);
  report.observations = report.observations.filter(o => o.id !== 'b');
  assert.deepEqual(markersForPlan(report, 'rdc'), []);
});

test('invalid imports fail explicitly instead of dropping points or requesting external images', () => {
  for (const change of [
    r => r.plans.push(plan()), r => r.plans[0].src = 'https://example.com/plan.png',
    r => r.plans[0].src = 'data:image/svg+xml;base64,AAAA', r => r.plans[0].width = 13000,
    r => r.observations.push({ id: 'a' }), r => r.plans = {},
    r => r.observations[0].reperes = [{ planId: 'missing', x: .5, y: .5 }],
    r => r.observations[0].reperes = [{ planId: 'rdc', x: '0.5', y: .5 }],
    r => r.observations[0].reperes = [{ planId: 'rdc', x: Infinity, y: .5 }],
    r => r.observations[0].reperes = [{ planId: 'rdc', x: -1, y: .5 }],
    r => r.observations[0].reperes = [{ planId: 'rdc', x: .5, y: .5 }, { planId: 'rdc', x: .2, y: .2 }],
  ]) { const report = dossier(); change(report); assert.ok(planPayloadError(report)); }
});

test('client map and legend show only selected observations and keep original numbering', () => {
  let report = dossier();
  report = setObservationPoint(report, 'a', 'rdc', { x: .2, y: .3 });
  report = setObservationPoint(report, 'b', 'rdc', { x: .6, y: .7 });
  const html = buildObservationPlansHtml(report, ['b']);
  assert.match(html, /Observation 2/); assert.doesNotMatch(html, /Observation 1|Constat A|data-plan-id="coupe"/);
  assert.match(html, /left:60%;top:70%/); assert.match(html, /RDC &lt;test&gt;/);
  assert.equal(buildObservationPlansHtml(report, []), '');
});

test('expert export includes all plans and observation cross references; client does not leak other observations', () => {
  let report = { ...dossier(), titre: 'Recette', meteo: {}, cadastre: {}, urbanisme: {}, risques: {}, terrain: {},
    protocoles: {}, analyse_expert: '', recommandations: '', reserves: '',
    observations: dossier().observations.map(o => ({ ...o, observations: o.titre, actions: '', piece: '', surface: '' })) };
  report = setObservationPoint(report, 'b', 'rdc', { x: .4, y: .6 });
  assert.match(buildReportHtml(report), /data-plan-id="coupe"/);
  assert.match(buildReportHtml(report), /<td>Repère 2<\/td>/);
  report.livrable = { audience: 'client', observations: ['b'] };
  const html = buildReportHtml(report);
  assert.match(html, /Observation 2 · Constat B/); assert.doesNotMatch(html, /Constat A/);
});

// Feu captured first, Eau captured last: protocol order is Eau -> Air -> Terre -> Feu -> À classer.
const photo = { id: 'ph', name: 'photo.png', src: 'data:image/png;base64,AAAA', horodatageISO: '2026-01-01T10:00:00Z' };
const habitologue = () => {
  const o = (id, phase, extra = {}) => ({ id, titre: `Constat ${id}`, observations: `Texte ${id}`, actions: `Conseil ${id}`,
    piece: '', surface: '', gravite: '', photos: [], ...(phase ? { phase_habitologie: phase } : {}), ...extra });
  return { ...dossier(), titre: 'Visite', categorie: 'Visite Globale', profil_metier: 'habitologue', meteo: {}, cadastre: {}, urbanisme: {},
    risques: {}, terrain: {}, protocoles: {}, analyse_expert: '', recommandations: '', reserves: '',
    observations: [o('feu', 'feu'), o('eau1', 'eau', { photos: [photo] }), o('air', 'air'), o('eau2', 'eau'), o('vrac')] };
};
const markerNumbers = (report, planId, selected) => Object.fromEntries(markersForPlan(report, planId, selected).map(m => [m.observationId, m.number]));

test('markers and plan legends follow the protocol order, not the capture order, without touching coordinates, text or photos', () => {
  let report = habitologue();
  for (const [id, x, y] of [['feu', .1, .2], ['eau1', .3, .4], ['eau2', .5, .6], ['air', .7, .8], ['vrac', .9, .95]]) report = setObservationPoint(report, id, 'rdc', { x, y });
  const before = structuredClone(report);
  assert.deepEqual(markerNumbers(report, 'rdc'), { eau1: 1, eau2: 2, air: 3, feu: 4, vrac: 5 });
  assert.deepEqual(markersForPlan(report, 'rdc').map(m => m.observationId), ['eau1', 'eau2', 'air', 'feu', 'vrac']);
  assert.deepEqual(report, before);
  const eau1 = markersForPlan(report, 'rdc')[0];
  assert.deepEqual([eau1.planId, eau1.x, eau1.y], ['rdc', .3, .4]);
  assert.deepEqual(report.observations[1].photos, [photo]); assert.equal(report.observations[1].observations, 'Texte eau1');
  const html = buildObservationPlansHtml(report);
  assert.ok(html.indexOf('Observation 1</strong> — Constat eau1') < html.indexOf('Observation 4</strong> — Constat feu'));
  assert.match(html, /left:30%;top:40%">1<\/span>/); assert.match(html, /left:10%;top:20%">4<\/span>/);
});

test('moving several findings of one phase renumbers markers and expert references identically, and survives a JSON round trip', () => {
  let report = habitologue();
  report = setObservationPoint(report, 'eau1', 'rdc', { x: .3, y: .4 });
  report = setObservationPoint(report, 'eau2', 'coupe', { x: .5, y: .6 });
  report.observations.push({ ...report.observations[3], id: 'eau3', titre: 'Constat eau3', reperes: [], phase_habitologie: 'eau' });
  const moved = moveObservation(moveObservation(report, 'eau3', 'eau1'), 'eau2', 'eau3');
  const restored = JSON.parse(JSON.stringify(moved));
  assert.deepEqual(restored, moved);
  assert.deepEqual(orderedObservations(restored).map(o => o.id), ['eau2', 'eau3', 'eau1', 'air', 'feu', 'vrac']);
  assert.equal(planPayloadError(restored), null);
  assert.equal(markerNumbers(restored, 'coupe').eau2, 1); assert.equal(markerNumbers(restored, 'rdc').eau1, 3);
  const html = buildReportHtml(restored);
  assert.match(html, /<h3>1\. Constat eau2<\/h3>[\s\S]*?<td>Repère 1<\/td>/);
  assert.match(html, /<h3>3\. Constat eau1<\/h3>[\s\S]*?<td>Repère 3<\/td>/);
  assert.match(html, /<h3>5\. Constat feu<\/h3>/); assert.match(html, /<h3>6\. Constat vrac<\/h3>/);
  assert.deepEqual(restored.observations.find(o => o.id === 'eau1').photos, [photo]);
  assert.match(html, /<h3>3\. Constat eau1<\/h3>[\s\S]*?alt="photo\.png"/);
});

test('client plan sheets keep global numbers when the selection has gaps and leak no excluded finding', () => {
  let report = habitologue();
  for (const id of ['feu', 'eau1', 'air', 'eau2']) report = setObservationPoint(report, id, 'rdc', { x: .25, y: .75 });
  report.livrable = { audience: 'client', observations: ['feu', 'eau2'] };
  assert.deepEqual(markerNumbers(report, 'rdc', ['feu', 'eau2']), { eau2: 2, feu: 4 });
  const html = buildReportHtml(report);
  assert.match(html, /Observation 2 · Constat eau2/); assert.match(html, /Observation 4 · Constat feu/);
  assert.match(html, /Observation 2<\/strong> — Constat eau2/); assert.match(html, /Observation 4<\/strong> — Constat feu/);
  assert.doesNotMatch(html, /Observation 1[^0-9]|Observation 3[^0-9]|Constat eau1|Constat air|Texte air|Conseil air/);
  assert.ok(html.indexOf('Observation 2 ·') < html.indexOf('Observation 4 ·'));
});
