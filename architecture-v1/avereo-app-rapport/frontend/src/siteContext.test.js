import test from 'node:test';
import assert from 'node:assert/strict';
import { terrainGrid, elevationUrl, summarizeTerrain, normalizeStoredTerrain, emptyTerrain, terrainMapSamples } from './terrainContext.js';
import { urbanismUrl, normalizeUrbanLayer, safeDocumentUrl, fetchUrbanism, normalizeStoredUrbanism } from './urbanismContext.js';
import { normalizeGeorisquesRiskSummary, emptyGeorisquesRiskSummary, buildGeorisquesRiskSummaryUrl } from './georisquesRiskSummary.js';

const grid = terrainGrid(-1.555923, 47.217762);
const payload = (values) => ({ elevations: grid.map((point, i) => ({ ...point, z: values[i] })) });

test('grille de neuf points orientee au nord, emprise bornee et URL sans donnees client', () => {
  assert.equal(grid.length, 9);
  assert.equal(grid[4].label, 'Centre');
  assert.equal(grid[4].lon, -1.555923);
  assert.ok(grid[0].lat > grid[4].lat && grid[0].lon < grid[4].lon);
  assert.equal(grid[2].east - grid[0].east, 50);
  assert.equal(terrainGrid(-1.55, 47.2, 100)[2].east, 50);
  assert.throws(() => terrainGrid(null, 47));
  assert.throws(() => terrainGrid(-1, 90));
  assert.throws(() => terrainGrid(-1, 47, 1000));
  const url = new URL(elevationUrl(grid));
  assert.equal(url.hostname, 'data.geopf.fr');
  assert.equal(url.searchParams.get('resource'), 'ign_rge_alti_wld');
  assert.equal(url.searchParams.get('lon').split('|').length, 9);
  assert.equal(url.searchParams.get('zonly'), 'false');
});

test('ecart et pente sont derives des mesures sans seuil de risque invente', () => {
  const result = summarizeTerrain(payload([10, 10, 10, 10, 10, 5, 10, 10, 10]), grid, 50);
  assert.equal(result.range, 5);
  assert.deepEqual(result.descent, { direction: 'E', percent: 20 });
  assert.equal(summarizeTerrain(payload(Array(9).fill(0)), grid, 50).descent, null);
  assert.equal(summarizeTerrain(payload(Array(9).fill(-2)), grid, 50).min, -2);
});

test('aucun resultat a partir de donnees altimetriques absentes, sentinelles ou decalees', () => {
  for (const bad of [null, -99999, NaN, '0']) {
    const values = Array(9).fill(0); values[2] = bad;
    assert.throws(() => summarizeTerrain(payload(values), grid, 50));
  }
  assert.throws(() => summarizeTerrain({ elevations: [] }, grid, 50));
  const wrong = payload(Array(9).fill(1)); wrong.elevations[0].lon += 1;
  assert.throws(() => summarizeTerrain(wrong, grid, 50));
});

test('reprise JSON preserve les saisies et recalcule le relief seulement au meme lieu', () => {
  const saved = { facade: 'Séjour', orientation: 'SE', notes: '<test>', analysis: summarizeTerrain(payload(Array(9).fill(12)), grid, 50) };
  const restored = normalizeStoredTerrain(JSON.parse(JSON.stringify(saved)), -1.555923, 47.217762);
  assert.deepEqual(restored, saved);
  assert.equal(normalizeStoredTerrain(saved, 2.2, 48.8).analysis, null);
  assert.deepEqual(normalizeStoredTerrain(null, '', ''), emptyTerrain());
  assert.equal(normalizeStoredTerrain({ orientation: 'inconnue' }, '', '').orientation, '');
});

test('la carte place les neuf valeurs aux coordonnees mesurees et distingue les extremes relatifs', () => {
  const analysis = summarizeTerrain(payload([8, 9, 10, 7, 8, 9, 6, 7, 8]), grid, 50);
  const samples = terrainMapSamples(analysis, grid[4].lon, grid[4].lat);
  assert.equal(samples.length, 9);
  samples.forEach((sample, i) => {
    assert.equal(sample.lon, grid[i].lon); assert.equal(sample.lat, grid[i].lat);
    assert.equal(sample.z, analysis.samples[i].z);
  });
  assert.equal(samples[2].level, 'high'); assert.equal(samples[6].level, 'low');
  assert.equal(samples[4].label, 'Centre'); assert.equal(samples[4].level, 'neutral');
});

test('la carte ne dessine aucune altitude absente, invalide ou liee a un ancien point', () => {
  const analysis = summarizeTerrain(payload(Array(9).fill(0)), grid, 50);
  assert.deepEqual(terrainMapSamples(null, grid[4].lon, grid[4].lat), []);
  assert.deepEqual(terrainMapSamples(analysis, 2, 48), []);
  analysis.samples[0].z = -99999;
  assert.deepEqual(terrainMapSamples(analysis, grid[4].lon, grid[4].lat), []);
});

test('une emprise de 100 m et des altitudes nulles ou negatives restent fideles sans faux contraste', () => {
  const wider = terrainGrid(grid[4].lon, grid[4].lat, 100);
  for (const z of [0, -2]) {
    const analysis = summarizeTerrain({ elevations: wider.map((p) => ({ ...p, z })) }, wider, 100);
    const samples = terrainMapSamples(analysis, grid[4].lon, grid[4].lat);
    assert.equal(samples.length, 9); assert.equal(samples[0].east, -50);
    assert.ok(samples.every((p) => p.z === z && p.level === 'neutral'));
  }
});

test('urbanisme ne transforme pas les libelles source en conclusions juridiques', () => {
  const normalized = normalizeUrbanLayer({ totalFeatures: 2, features: [{ properties: { gid: 7, libelle: 'Secteur protégé', txt: 'A vérifier', urlfic: 'javascript:alert(1)', typepsc: '99' } }] }, 'prescription-surf');
  assert.equal(normalized.items[0].title, 'Secteur protégé');
  assert.equal(normalized.items[0].url, '');
  assert.equal(normalized.partial, true);
  assert.deepEqual(normalizeUrbanLayer({ features: [] }, 'zone-urba').items, []);
  assert.throws(() => normalizeUrbanLayer({}, 'zone-urba'));
  assert.throws(() => urbanismUrl('unknown', -1, 47));
  assert.throws(() => urbanismUrl('zone-urba', null, 47));
  assert.equal(safeDocumentUrl('https://mairie.example/reglement'), 'https://mairie.example/reglement');
  assert.equal(safeDocumentUrl('https://user:password@mairie.example'), '');
  assert.equal(safeDocumentUrl('data:text/html,test'), '');
});

test('une source GPU en erreur est distincte d une liste vide et les succes restent disponibles', async (t) => {
  t.mock.method(globalThis, 'fetch', async (url) => ({
    ok: !String(url).includes('prescription-surf'),
    json: async () => ({ features: [] }),
  }));
  const result = await fetchUrbanism(-1, 47, new AbortController().signal);
  assert.equal(result.results.find((r) => r.layer === 'prescription-surf').error, true);
  assert.equal(result.results.find((r) => r.layer === 'zone-urba').error, undefined);
  assert.equal(normalizeStoredUrbanism(JSON.parse(JSON.stringify(result)), -1, 47).results.length, 5);
  assert.equal(normalizeStoredUrbanism(result, -2, 47), null);
});

test('une panne complete de GPU est explicite', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => { throw new Error('offline'); });
  await assert.rejects(fetchUrbanism(-1, 47, new AbortController().signal));
});

test('Georisques invalide ne devient jamais une synthese de zero risque', () => {
  for (const payload of [null, {}, { error: 'Service indisponible' }, { risquesNaturels: [] }]) {
    assert.throws(() => normalizeGeorisquesRiskSummary(payload));
  }
  assert.equal(emptyGeorisquesRiskSummary().fetchedAt, '');
  assert.equal(normalizeGeorisquesRiskSummary({ risquesNaturels: {}, risquesTechnologiques: {} }).naturels.length, 0);
  assert.equal(buildGeorisquesRiskSummaryUrl(false, 47), null);
});
