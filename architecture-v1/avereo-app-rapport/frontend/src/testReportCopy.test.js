import test from 'node:test';
import assert from 'node:assert/strict';
import { createTestReportCopy } from './testReportCopy.js';

test('only catalogue choices survive in an independent, importable test copy', () => {
  const privateValue = 'PRIVATE-SENTINEL';
  const input = {
    titre: privateValue, proprietaire: privateValue, onlineReportId: privateValue,
    signature: privateValue, unknownFutureField: privateValue,
    categorie: 'Visite Globale', sous_categorie: 'Maison',
    cadastre: { lon: privateValue }, ecoute: { sujets_identifies: ['air', privateValue] },
    protocoles: { standard: true, extra: privateValue },
    habitologie_protocoles: { air: { enabled: false, controls: {presence_ventilation: true, installation_entretien: privateValue} } },
    observations: [
      { id: privateValue, titre: privateValue, photos: [{src: privateValue}], reperes: [privateValue],
        phase_habitologie: 'air', controle_habitologie: 'presence_ventilation', gravite: 'Critique' },
      { phase_habitologie: privateValue, controle_habitologie: privateValue, gravite: privateValue },
    ],
  };
  const before = structuredClone(input);
  const copy = createTestReportCopy(input);
  assert.deepEqual(input, before);
  assert.equal(JSON.stringify(copy).includes(privateValue), false);
  assert.equal('onlineReportId' in copy, false);
  assert.notEqual(copy.reference_dossier, createTestReportCopy(input).reference_dossier);
  assert.equal(copy.sous_categorie, 'Maison');
  assert.deepEqual(copy.habitologie_protocoles.air, {enabled:false, controls:{presence_ventilation:true}});
  assert.equal(copy.observations.length, 2);
  assert.equal(copy.observations[0].gravite, 'Critique');
  assert.equal(copy.observations[0].controle_habitologie, 'presence_ventilation');
  assert.deepEqual(copy.observations[0].photos, []);
  assert.equal(copy.observations[1].phase_habitologie, '');
  assert.equal(createTestReportCopy({report_type:'habitologie'}).categorie, 'Visite Globale');
});
