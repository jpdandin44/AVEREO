import test from 'node:test';
import assert from 'node:assert/strict';
import { createThermoProjects } from '../src/thermo-projects.js';

function fixture(initial) {
  let value = initial, id = 0;
  return { library: createThermoProjects({ get: async () => structuredClone(value), update: async (_, change) => { value = structuredClone(change(value)); } }, () => `fixture-${++id}`, () => '2026-11-06T12:00:00Z'), raw: () => value };
}
test('plusieurs rapports indépendants, photos et champs inconnus préservés', async () => {
  const { library } = fixture();
  const first = await library.save({ categorie: 'Thermo', reference: 'A', thermogrammes: [{ photo: 'base64-photo', annotations: [1, 2] }], future: { signed: true } });
  await library.save({ categorie: 'Thermo', reference: 'B' });
  const before = JSON.stringify((await library.list())[0]);
  const projects = await library.list(); projects[0].data.thermogrammes[0].photo = 'changed-in-memory';
  assert.equal(JSON.stringify((await library.list())[0]), before);
  await library.save({ ...first, reference: 'A mise à jour' });
  const saved = await library.list();
  assert.equal(saved.length, 2); assert.equal(saved[0].data.thermogrammes[0].photo, 'base64-photo');
  assert.equal(saved[0].data.future.signed, true); assert.equal(saved[1].data.reference, 'B');
});
test('catalogue illisible : aucun remplacement', async () => {
  const { library, raw } = fixture({ legacy: 'keep-exactly' });
  await assert.rejects(library.list(), /illisible/);
  await assert.rejects(library.save({ categorie: 'Thermo' }), /illisible/);
  assert.deepEqual(raw(), { legacy: 'keep-exactly' });
});
test('quota ou stockage refusé : échec propagé au parcours, aucun faux succès', async () => {
  const library = createThermoProjects({ get: async () => [], update: async () => { throw new Error('Quota'); } }, () => 'fixture');
  await assert.rejects(library.save({ categorie: 'Thermo' }), /Quota/);
});
