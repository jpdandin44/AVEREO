import assert from 'node:assert/strict';
import test from 'node:test';

import {
  HABITOLOGIE_PROTOCOL_STAGES,
  createHabitologieProtocolState,
  findHabitologieControl,
  mergeHabitologieProtocolState,
} from './habitologieProtocol.js';

test('conserve le protocole Eau Air Terre Feu dans cet ordre', () => {
  assert.deepEqual(HABITOLOGIE_PROTOCOL_STAGES.map((stage) => stage.label), ['Eau', 'Air', 'Terre', 'Feu']);
});

test('active tous les points du protocole par defaut', () => {
  const protocol = createHabitologieProtocolState();
  for (const stage of HABITOLOGIE_PROTOCOL_STAGES) {
    assert.equal(Object.keys(protocol[stage.key].controls).length, stage.controls.length);
    assert.ok(Object.values(protocol[stage.key].controls).every(Boolean));
  }
});

test('fusionne un brouillon sans perdre les nouveaux controles', () => {
  const protocol = mergeHabitologieProtocolState({
    eau: { controls: { infiltrations: false } },
  });

  assert.equal(protocol.eau.controls.infiltrations, false);
  assert.equal(protocol.eau.controls.humidite, true);
  assert.equal(protocol.air.controls.presence_ventilation, true);
});

test('retrouve le libelle du point de controle', () => {
  assert.equal(findHabitologieControl('feu', 'regulation')?.label, 'Régulation, programmation et commandes');
  assert.equal(findHabitologieControl('eau', 'inconnu'), null);
});
