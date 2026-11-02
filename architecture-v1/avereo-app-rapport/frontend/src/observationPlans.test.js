import test from 'node:test';
import assert from 'node:assert/strict';
import { markersForPlan, observationPlanNames, planPayloadError, setObservationPoint } from './observationPlans.js';
import { buildObservationPlansHtml } from './reportHtml.js';
import { buildReportHtml } from './reportDelivery.js';

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
  assert.match(html, /Repère 2 · Constat B/); assert.doesNotMatch(html, /Constat A/);
});
