import test from 'node:test';
import assert from 'node:assert/strict';
import { readMissions, writeMissions } from '../src/mission-storage.js';

test('la lecture ne réécrit pas les missions et leurs champs inconnus', () => {
  const raw = '[ { "id": "fictive", "future": {"keep": true} } ]';
  let saved = raw;
  const storage = { getItem: () => saved, setItem: (_, value) => { saved = value; } };
  const missions = readMissions(storage);
  assert.equal(saved, raw); assert.equal(missions[0].future.keep, true);
  writeMissions([...missions, { id: 'second' }], storage);
  assert.equal(readMissions(storage)[0].future.keep, true);
});
test('une liste corrompue ne peut pas être écrasée par une nouvelle mission', () => {
  for (const raw of ['invalid', '{}', '[null]']) {
    let writes = 0;
    const storage = { getItem: () => raw, setItem: () => { writes++; } };
    assert.throws(() => writeMissions([{ id: 'fixture' }], storage)); assert.equal(writes, 0);
  }
});
test('un quota dépassé est propagé pour maintenir l’éditeur ouvert', () => {
  assert.throws(() => writeMissions([{ id: 'fixture' }], { getItem: () => '[]', setItem: () => { throw new Error('Quota'); } }), /Quota/);
});
