import test from 'node:test';
import assert from 'node:assert/strict';
import { isHabitologueProfile, allowsDecisionProjections, observationAdviceLabel } from './reportProfiles.js';

test('the category alone never converts an existing report into a Habitologue mission', () => {
  for (const report of [{}, { categorie: 'Visite Globale' }, { profil_metier: 'architecte' }, { profil_metier: 'unknown' }]) {
    assert.equal(isHabitologueProfile(report), false);
    assert.equal(allowsDecisionProjections(report), true);
    assert.equal(observationAdviceLabel(report), 'Conseils habitologue');
  }
});

test('Habitologue changes the presentation without modifying historical decision data', () => {
  const report = { profil_metier: 'habitologue', decision: { actions: [{ id: 'keep' }], option_a: { nom: 'Conserver' } } };
  const before = JSON.stringify(report);
  assert.equal(isHabitologueProfile(report), true);
  assert.equal(allowsDecisionProjections(report), false);
  assert.equal(observationAdviceLabel(report), 'Conseils habitologue');
  assert.equal(JSON.stringify(report), before);
});
