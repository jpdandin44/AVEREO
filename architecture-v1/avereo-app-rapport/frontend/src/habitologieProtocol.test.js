import assert from 'node:assert/strict';
import test from 'node:test';

import {
  HABITOLOGIE_PROTOCOL_STAGES,
  createHabitologieProtocolState,
  findHabitologieControl,
  isHabitologieControlSelected,
  mergeHabitologieProtocolState,
} from './habitologieProtocol.js';

test('conserve le protocole Eau Air Terre Feu dans cet ordre', () => {
  assert.deepEqual(HABITOLOGIE_PROTOCOL_STAGES.map((stage) => stage.label), ['Eau', 'Air', 'Terre', 'Feu']);
});

test('ne selectionne aucun point pour un nouveau dossier sans ecoute', () => {
  const protocol = createHabitologieProtocolState();
  for (const stage of HABITOLOGIE_PROTOCOL_STAGES) {
    for (const control of stage.controls) {
      assert.equal(isHabitologieControlSelected({ habitologie_protocoles: protocol }, stage.key, control.key), false);
    }
  }
});

test('fusionne un brouillon sans perdre les nouveaux controles', () => {
  const protocol = mergeHabitologieProtocolState({
    eau: { controls: { infiltrations: false, humidite: true } },
  });

  assert.equal(protocol.eau.controls.infiltrations, false);
  assert.equal(protocol.eau.controls.humidite, true);
  assert.equal(isHabitologieControlSelected({ habitologie_protocoles: protocol }, 'air', 'presence_ventilation'), false);
});

test('seuls les sujets explicitement identifies suggerent des controles', () => {
  const report = { ecoute: { preoccupations: 'infiltrations', sujets_identifies: ['humidite'] } };
  assert.equal(isHabitologieControlSelected(report, 'eau', 'humidite'), true);
  assert.equal(isHabitologieControlSelected(report, 'air', 'presence_ventilation'), true);
  assert.equal(isHabitologieControlSelected(report, 'terre', 'vapeur_eau'), true);
  assert.equal(isHabitologieControlSelected(report, 'eau', 'infiltrations'), false);
  assert.equal(isHabitologieControlSelected(report, 'feu', 'regulation'), false);
});

test('les ajustements manuels priment sur les suggestions et survivent a la fusion', () => {
  const report = {
    ecoute: { sujets_identifies: ['humidite'] },
    habitologie_protocoles: mergeHabitologieProtocolState({ eau: { controls: { humidite: false, infiltrations: true } } }),
  };
  assert.equal(isHabitologieControlSelected(report, 'eau', 'humidite'), false);
  assert.equal(isHabitologieControlSelected(report, 'eau', 'infiltrations'), true);
  report.ecoute.sujets_identifies = [];
  assert.equal(isHabitologieControlSelected(report, 'air', 'presence_ventilation'), false);
  assert.equal(isHabitologieControlSelected(report, 'eau', 'infiltrations'), true);
});

test('un sujet encore present maintient une suggestion commune', () => {
  const report = { ecoute: { sujets_identifies: ['air', 'humidite'] } };
  assert.equal(isHabitologieControlSelected(report, 'air', 'presence_ventilation'), true);
  report.ecoute.sujets_identifies = ['air'];
  assert.equal(isHabitologieControlSelected(report, 'air', 'presence_ventilation'), true);
  report.ecoute.sujets_identifies = null;
  assert.equal(isHabitologieControlSelected(report, 'air', 'presence_ventilation'), false);
});

test('retrouve le libelle du point de controle', () => {
  assert.equal(findHabitologieControl('feu', 'regulation')?.label, 'Régulation, programmation et commandes');
  assert.equal(findHabitologieControl('eau', 'inconnu'), null);
});
