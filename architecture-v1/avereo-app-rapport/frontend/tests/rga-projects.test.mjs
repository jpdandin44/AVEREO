import test from 'node:test';
import assert from 'node:assert/strict';
import { createRgaProjects, RGA_PROJECTS_KEY } from '../public/rga/project-library.js';

function fixture() {
  const store = new Map([['rapport-draft', '{"signature":"intacte"}']]);
  let id = 0;
  return { store, library: createRgaProjects({ getItem: key => store.get(key) ?? null, setItem: (key, value) => store.set(key, value) }, () => `fixture-${++id}`, () => '2026-11-06T12:00:00Z') };
}
const point = { lon: 1.4, lat: 43.6, label: 'Adresse fictive' };
test('les projets RGA mémorisent le point, sans stocker un ancien résultat de risque ni toucher Rapport', () => {
  const { store, library } = fixture();
  library.save({ ...point, risk: 'obsolete' }, 'Bien A'); library.save({ ...point, lon: 1.5 }, 'Bien B');
  const saved = library.list(); assert.equal(saved.length, 2); assert.deepEqual(saved[0].point, point);
  assert.equal(saved[1].name, 'Bien B'); assert.equal(store.get('rapport-draft'), '{"signature":"intacte"}');
});
test('JSON corrompu ou coordonnées invalides : liste conservée', () => {
  const { store, library } = fixture(); store.set(RGA_PROJECTS_KEY, 'invalid');
  assert.throws(() => library.save(point, 'Test')); assert.equal(store.get(RGA_PROJECTS_KEY), 'invalid');
  store.set(RGA_PROJECTS_KEY, '[]'); assert.throws(() => library.save({ ...point, lat: 100 }, 'Test'));
  assert.equal(store.get(RGA_PROJECTS_KEY), '[]');
});
test('erreur de stockage signalée au lieu d’un faux enregistrement', () => {
  const library = createRgaProjects({ getItem: () => null, setItem: () => { throw new Error('Quota'); } }, () => 'fixture');
  assert.throws(() => library.save(point, 'Test'), /Quota/);
});
