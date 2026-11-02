import test from 'node:test';
import assert from 'node:assert/strict';
import { appendDictation } from './dictationText.js';

test('dictation keeps manual text and separates the spoken addition', () => {
  assert.equal(appendDictation('Trace existante', 'à vérifier'), 'Trace existante à vérifier ');
  assert.equal(appendDictation('Trace existante\n', '  après pluie  '), 'Trace existante\naprès pluie ');
});
test('successive final results use the latest value', () => {
  let value = 'Note';
  for (const text of ['eau', 'puis air']) value = appendDictation(value, text);
  assert.equal(value, 'Note eau puis air ');
});
test('empty speech does not alter the field and bounded fields stay bounded', () => {
  assert.equal(appendDictation('Texte', '  '), 'Texte');
  assert.equal(appendDictation('', 'Budget', 5), 'Budge');
  assert.equal(appendDictation('12345', 'suite', 5), '12345');
  assert.equal(appendDictation('Ancien texte importé long', 'suite', 5), 'Ancien texte importé long');
});
