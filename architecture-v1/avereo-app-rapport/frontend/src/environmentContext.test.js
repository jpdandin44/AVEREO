import test from 'node:test';
import assert from 'node:assert/strict';
import { environmentContext, newEnvironmentContext, changeEnvironmentContext, removeEnvironmentContext, environmentContextError } from './environmentContext.js';
import { buildReportHtml, deliveryOptions } from './reportDelivery.js';
import { buildEnvironmentContextHtml } from './reportHtml.js';
import { orderedObservations, observationNumber } from './observationOrder.js';
import { markersForPlan } from './observationPlans.js';
import { independentReport, readReportFile, reportContentSummary } from './reportFiles.js';
import { createTestReportCopy } from './testReportCopy.js';

const image = 'data:image/png;base64,AAAA';
const dossier = () => ({ profil_metier: 'habitologue', categorie: 'Visite Globale', titre: 'Dossier fictif', meteo: {}, cadastre: {}, urbanisme: {}, risques: {}, terrain: { notes: 'Relief existant' },
  protocoles: {}, analyse_expert: '', recommandations: '', reserves: '', signature: '', livrable: { audience: 'expert', observations: ['f'] },
  observations: [{ id: 'f', phase_habitologie: 'feu', titre: 'Chauffage', observations: 'Constat chauffage', actions: 'Conseil chauffage', photos: [], reperes: [{ planId: 'p', x: .2, y: .3 }] },
    { id: 'e', phase_habitologie: 'eau', titre: 'Eau', observations: 'Constat eau', actions: 'Conseil eau', photos: [] }],
  plans: [{ id: 'p', title: 'Vue du site', source: 'Plan fictif', src: image, width: 30, height: 20, kind: 'niveau' }] });
const context = () => ({ ...newEnvironmentContext('ctx-stable'), titre: 'Abords fictifs', zone: 'Jardin', constat: 'Contexte à conserver', explications: 'Source https://example.org/terrain?a=1&b=2', conseils: 'Vérifier sur place',
  photo: { id: 'ph-ctx', name: 'Photo extérieure', src: image, width: 30, height: 20, source: 'Visite fictive', caption: 'Vue extérieure' } });

test('recognized global mission profiles retain context, its media and selected client advice without renumbering', () => {
  const reference = { ...dossier(), contexte_exterieur: { ...context(), includeInClient: true } };
  for (const profil_metier of ['architecte', 'maitre_oeuvre']) {
    const report = { ...reference, profil_metier }, before = structuredClone(report);
    assert.equal(buildEnvironmentContextHtml(report), buildEnvironmentContextHtml(reference));
    const expert = buildReportHtml(report);
    assert.match(expert, /Contexte à conserver/); assert.ok(expert.includes(image));
    const client = buildReportHtml({ ...report, livrable: { ...report.livrable, audience: 'client' } });
    assert.match(client, /Contexte à conserver/); assert.match(client, /Conseil chauffage/); assert.doesNotMatch(client, /Conseil eau/);
    assert.equal(observationNumber(report, report.observations[0]), 2);
    assert.deepEqual(report, before);
  }
  assert.equal(buildEnvironmentContextHtml({ ...reference, profil_metier: 'ancien-inconnu' }), '');
});

test('old reports acquire no context or changed layout through reading and export', () => {
  const r = dossier(), before = structuredClone(r);
  assert.equal(environmentContext(r), null); assert.equal(environmentContextError(r), null);
  assert.doesNotMatch(buildReportHtml(r), /Contexte Environnement/); assert.deepEqual(r, before);
  assert.equal(independentReport(r).contexte_exterieur, undefined);
});

test('separate context never changes observation order, numbers, markers, selections or terrain measurements', () => {
  const r = dossier(), baseline = structuredClone(r); r.contexte_exterieur = context();
  const changed = changeEnvironmentContext(r, 'ctx-stable', { constat: 'Constat corrigé', planId: 'p' });
  assert.equal(changed.observations, r.observations); assert.equal(changed.livrable, r.livrable); assert.equal(changed.terrain, r.terrain);
  assert.deepEqual(orderedObservations(changed).map(o => o.id), ['e', 'f']);
  assert.equal(observationNumber(changed, changed.observations[0]), 2);
  assert.deepEqual(markersForPlan(changed, 'p'), markersForPlan(baseline, 'p'));
  assert.deepEqual(deliveryOptions(changed).observations, ['f']);
  assert.equal(changed.contexte_exterieur.id, 'ctx-stable');
});

test('expert includes context and images; client excludes it until explicitly selected outside its observation list', () => {
  const r = dossier(); r.contexte_exterieur = context();
  assert.match(buildReportHtml(r), /Abords fictifs/);
  r.livrable.audience = 'client'; assert.doesNotMatch(buildReportHtml(r), /Abords fictifs|Photo extérieure|Vue extérieure/);
  r.contexte_exterieur.includeInClient = true;
  const html = buildReportHtml(r);
  assert.match(html, /Contexte Environnement \/ Terrain/); assert.match(html, /Vue extérieure/);
  assert.match(html, /<section class="environment-context-report client-page">/);
  assert.match(html, /Observation 2 · Chauffage/); assert.doesNotMatch(html, /Observation 1 · Eau/);
  assert.deepEqual(r.livrable.observations, ['f']); assert.equal(r.observations.length, 2);
});

test('JSON independent import preserves context, unknown fields, picture bytes, source and links', () => {
  const r = dossier(); r.onlineReportId = 'source-id'; r.contexte_exterieur = { ...context(), futureField: { preserved: true } };
  const copy = independentReport(readReportFile(JSON.stringify(r)));
  assert.equal(copy.onlineReportId, undefined); assert.deepEqual(copy.contexte_exterieur, r.contexte_exterieur);
  assert.equal(reportContentSummary(copy).photos, 1);
  assert.match(buildEnvironmentContextHtml(copy), /href="https:\/\/example.org\/terrain\?a=1&amp;b=2"/);
});

test('pending results cannot recreate a removed context or attach to another context id', () => {
  const r = { ...dossier(), contexte_exterieur: context() };
  const removed = removeEnvironmentContext(r, 'ctx-stable');
  assert.equal(changeEnvironmentContext(removed, 'ctx-stable', { photo: context().photo }), removed);
  const replaced = { ...removed, contexte_exterieur: newEnvironmentContext('replacement') };
  assert.equal(changeEnvironmentContext(replaced, 'ctx-stable', { photo: context().photo }), replaced);
  assert.equal(removeEnvironmentContext(replaced, 'ctx-stable'), replaced);
  assert.deepEqual(removed.observations, r.observations);
});

test('an absent or removed associated view stays explicit without substituting another image', () => {
  const r = { ...dossier(), contexte_exterieur: { ...context(), photo: null, planId: '' } };
  assert.match(buildEnvironmentContextHtml(r), /Aucun visuel extérieur associé/);
  r.contexte_exterieur.planId = 'missing';
  assert.match(buildEnvironmentContextHtml(r), /Vue associée indisponible/);
  assert.equal(r.contexte_exterieur.planId, 'missing');
  r.contexte_exterieur.planId = 'p';
  const html = buildEnvironmentContextHtml(r);
  assert.match(html, /Vue associée — Vue du site/); assert.match(html, /Plan fictif/);
  assert.doesNotMatch(html, /data-plan-id|plan-dot|Observation \d/);
});

test('test structure never discloses context text, links, location, image or reference', () => {
  const r = { ...dossier(), contexte_exterieur: context() };
  const copy = createTestReportCopy(r);
  assert.equal(copy.contexte_exterieur, undefined); assert.doesNotMatch(JSON.stringify(copy), /ctx-stable|Jardin|AAAA|example.org/);
});

test('context text is escaped and only safe links and bounded embedded images are accepted', () => {
  const r = { ...dossier(), contexte_exterieur: { ...context(), titre: '<img onerror=alert(1)>', constat: '<script>alert(2)</script>' } };
  const html = buildEnvironmentContextHtml(r);
  assert.match(html, /&lt;script&gt;/); assert.doesNotMatch(html, /<script>|<img onerror/);
  for (const invalid of [[], 'metadata', { id: '' }, { ...context(), includeInClient: 'true' }, { ...context(), photo: { ...context().photo, src: 'https://example.org/private.jpg' } }, { ...context(), photo: { ...context().photo, width: 13000 } }]) {
    assert.ok(environmentContextError({ contexte_exterieur: invalid }));
    assert.throws(() => readReportFile(JSON.stringify({ ...dossier(), contexte_exterieur: invalid })), /contexte extérieur|contexte extérieur|Photo du contexte extérieur/i);
  }
});
