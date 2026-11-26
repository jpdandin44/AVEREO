import test from 'node:test';
import assert from 'node:assert/strict';
import { siteConditions, withSiteConditions, updateSiteCondition, siteConditionDifferences, siteConditionRows } from './siteConditions.js';
import { observationContextOptions } from './observationContext.js';
import { buildReportHtml } from './reportDelivery.js';

test('legacy measures keep their recorded location, including unlocated mixed measurements', () => {
  for (const environment of ['Interieur', 'Exterieur', 'Mixte']) {
    const report = { environnement: environment, meteo: { temperatureC: '0', humiditePct: '55', vent: 'Nord' }, unknown: { keep: true } };
    const original = structuredClone(report), restored = withSiteConditions(report);
    assert.deepEqual(report, original); assert.deepEqual(restored.meteo, original.meteo);
    assert.deepEqual(restored.unknown, original.unknown);
    const expected = environment === 'Interieur' ? 'interieur' : environment === 'Exterieur' ? 'exterieur' : 'historique';
    assert.equal(restored.conditions_site[expected].temperatureC, '0');
    const switched = { ...restored, environnement: environment === 'Interieur' ? 'Exterieur' : 'Interieur' };
    assert.equal(siteConditions(switched)[expected].humiditePct, '55');
    assert.deepEqual(siteConditionDifferences(switched), { temperatureC: null, humiditePoints: null });
  }
});

test('independent conditions survive context changes and JSON without replacing media or future fields', () => {
  const original = { environnement: 'Interieur', meteo: { temperatureC: '19', humiditePct: '50' }, photos: ['original'],
    conditions_site: { interieur: { temperatureC: '21', humiditePct: '60', co2Ppm: '900', future: 'keep' }, exterieur: { temperatureC: '-3', humiditePct: '80' }, future: { keep: true } } };
  const before = structuredClone(original), edited = updateSiteCondition(original, 'interieur', 'co2Ppm', '0');
  const loaded = withSiteConditions(JSON.parse(JSON.stringify({ ...edited, environnement: 'Mixte' })));
  assert.deepEqual(siteConditionDifferences(loaded), { temperatureC: 24, humiditePoints: -20 });
  assert.equal(loaded.conditions_site.interieur.co2Ppm, '0');assert.equal(loaded.conditions_site.interieur.future, 'keep');
  assert.deepEqual(loaded.conditions_site.future, { keep: true });assert.deepEqual(loaded.photos, ['original']);
  assert.deepEqual(original, before);assert.deepEqual(loaded.meteo, before.meteo);
});

test('deltas distinguish missing, malformed and out of range humidity from zero', () => {
  const report = { conditions_site: { interieur: { temperatureC: '0', humiditePct: 0 }, exterieur: { temperatureC: '-2,5', humiditePct: '10' } } };
  assert.deepEqual(siteConditionDifferences(report), { temperatureC: 2.5, humiditePoints: -10 });
  for (const bad of ['', ' ', undefined, null, false, 'inconnu', Infinity]) {
    const changed = updateSiteCondition(report, 'interieur', 'temperatureC', bad);
    assert.equal(siteConditionDifferences(changed).temperatureC, null);
  }
  assert.equal(siteConditionDifferences(updateSiteCondition(report, 'interieur', 'humiditePct', '101')).humiditePoints, null);
});

test('expert and client exports keep both sets of measures, units and explicit differences with escaped data', () => {
  const report = { titre: 'Fictif', categorie: 'Visite Globale', environnement: 'Mixte', observations: [], meteo: {}, cadastre: {}, urbanisme: {}, protocoles: {},
    conditions_site: { interieur: { temperatureC: '21', humiditePct: '40', co2Ppm: '850' }, exterieur: { temperatureC: '11', humiditePct: '65' } } };
  for (const audience of ['expert', 'client']) {
    const html = buildReportHtml({ ...report, livrable: { audience } });
    for (const text of ['Conditions intérieures', 'Conditions extérieures', '850 ppm', '10 °C', '-25 point(s)']) assert.ok(html.includes(text), `${audience}: ${text}`);
    assert.doesNotMatch(buildReportHtml({ ...report, livrable: { audience }, conditions_site: { ...report.conditions_site, interieur: { co2Ppm: '<img src=x onerror=bad()>' } } }), /<img src=x/);
  }
  assert.deepEqual(siteConditionRows({ environnement: 'Mixte', meteo: {} }), []);
});

test('terrain and exterior suggestions preserve existing custom data and do not add interior elements', () => {
  const observation = { phase_habitologie: 'terrain', piece: 'Zone sur mesure', surface: 'Élément historique' }, before = structuredClone(observation);
  const terrain = observationContextOptions({ environnement: 'Interieur' }, observation);
  for (const item of ['Terrasse','Jardin','Annexes','Route','Trottoir']) assert.ok(terrain.zones.includes(item));
  for (const item of ['Pied de mur','Caniveau','Sol']) assert.ok(terrain.elements.includes(item));
  for (const piece of ['Exterieur', 'Extérieur', 'Façade', 'Terrasse']) {
    const outside = observationContextOptions({ environnement: 'Mixte' }, { phase_habitologie: 'eau', piece });
    assert.equal(outside.context, 'exterieur');assert.ok(outside.elements.includes('Gouttière'));assert.ok(!outside.elements.includes('Plafond'));
  }
  assert.equal(observationContextOptions({ environnement: 'Mixte' }, { piece: 'Chambre' }).context, 'interieur');
  assert.deepEqual(observation, before);
});
