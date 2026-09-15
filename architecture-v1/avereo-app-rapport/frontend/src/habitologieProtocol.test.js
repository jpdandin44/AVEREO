import assert from 'node:assert/strict';
import test from 'node:test';

import {
  HABITOLOGIE_PROTOCOL_STAGES,
  createHabitologieProtocolState,
  findHabitologieControl,
  isHabitologieControlSelected,
  isHabitologieStageEnabled,
  setHabitologieStageEnabled,
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

test('les anciens brouillons gardent toutes les phases disponibles sans tout cocher', () => {
  for (const value of [undefined, null, {}, { air: { controls: { presence_ventilation: true } } }]) {
    const report = { habitologie_protocoles: mergeHabitologieProtocolState(value) };
    for (const stage of HABITOLOGIE_PROTOCOL_STAGES) assert.equal(isHabitologieStageEnabled(report, stage.key), true);
    assert.equal(isHabitologieControlSelected(report, 'feu', 'regulation'), false);
  }
});

test('chaque phase peut etre suspendue puis restauree sans affecter les autres ni les observations', () => {
  const report = {
    ecoute: { sujets_identifies: ['humidite', 'air', 'chauffage', 'enveloppe'] },
    habitologie_protocoles: mergeHabitologieProtocolState({ air: { controls: { presence_ventilation: false } } }),
    observations: [{ id: 'obs-air', phase_habitologie: 'air', observations: 'Constat conservé', photos: [{ src: 'photo-test' }] }],
    protocoles: { humidite: true },
  };
  const original = structuredClone(report);
  for (const stage of HABITOLOGIE_PROTOCOL_STAGES) {
    const expected = stage.controls.map((control) => isHabitologieControlSelected(report, stage.key, control.key));
    const off = setHabitologieStageEnabled(report, stage.key, false);
    assert.equal(off.observations, report.observations);
    assert.equal(off.protocoles, report.protocoles);
    assert.equal(isHabitologieStageEnabled(off, stage.key), false);
    for (const control of stage.controls) assert.equal(isHabitologieControlSelected(off, stage.key, control.key), false);
    for (const other of HABITOLOGIE_PROTOCOL_STAGES.filter((item) => item !== stage)) {
      assert.equal(off.habitologie_protocoles[other.key], report.habitologie_protocoles[other.key]);
    }
    // Simulate saved JSON, reload, and listening changes while the phase is suspended.
    const loaded = JSON.parse(JSON.stringify(off));
    loaded.habitologie_protocoles = mergeHabitologieProtocolState(loaded.habitologie_protocoles);
    loaded.ecoute.sujets_identifies = ['infiltrations', 'confort'];
    for (const control of stage.controls) assert.equal(isHabitologieControlSelected(loaded, stage.key, control.key), false);
    const on = setHabitologieStageEnabled(loaded, stage.key, true);
    assert.deepEqual(stage.controls.map((control) => isHabitologieControlSelected(on, stage.key, control.key)), expected);
    assert.deepEqual(on.observations, report.observations);
  }
  assert.deepEqual(report, original);
});

test('une phase vide ne devient pas selectionnee apres reactivation', () => {
  let report = setHabitologieStageEnabled({}, 'air', false);
  report.ecoute = { sujets_identifies: ['air'] };
  report = setHabitologieStageEnabled(report, 'air', true);
  for (const control of HABITOLOGIE_PROTOCOL_STAGES[1].controls) assert.equal(isHabitologieControlSelected(report, 'air', control.key), false);
});

test('plusieurs phases desactivees et les appels repetes ne perdent pas les choix conserves', () => {
  const report = { ecoute: { sujets_identifies: ['air', 'chauffage'] } };
  const off = HABITOLOGIE_PROTOCOL_STAGES.reduce((value, stage) => setHabitologieStageEnabled(value, stage.key, false), report);
  for (const stage of HABITOLOGIE_PROTOCOL_STAGES) {
    assert.equal(isHabitologieStageEnabled(off, stage.key), false);
    assert.equal(setHabitologieStageEnabled(off, stage.key, false), off);
  }
  const on = setHabitologieStageEnabled(off, 'air', true);
  assert.equal(isHabitologieControlSelected(on, 'air', 'presence_ventilation'), true);
  assert.equal(isHabitologieControlSelected(on, 'feu', 'regulation'), false);
});

test('une entree invalide ou un etat identique ne modifie pas le rapport', () => {
  const report = {};
  assert.equal(setHabitologieStageEnabled(report, 'air', true), report);
  assert.equal(setHabitologieStageEnabled(report, 'inconnu', false), report);
  assert.equal(setHabitologieStageEnabled(report, 'air', 'false'), report);
  assert.equal(isHabitologieStageEnabled(report, 'inconnu'), false);
  assert.equal(mergeHabitologieProtocolState({ air: { enabled: false } }).air.enabled, false);
  assert.equal(mergeHabitologieProtocolState({ air: { enabled: 'false' } }).air.enabled, true);
});
