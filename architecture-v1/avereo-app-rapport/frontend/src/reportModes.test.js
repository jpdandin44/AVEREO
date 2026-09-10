import assert from 'node:assert/strict';
import test from 'node:test';

import {
  HABITOLOGIE_STEPS,
  REPORT_SCHEMA_VERSION,
  REPORT_TYPES,
  applyReportMetadata,
  createHabitologieReport,
  normalizeHabitologieReport,
  resolveReportType,
} from './reportModes.js';

test('un brouillon historique sans metadonnees reste un rapport technique', () => {
  assert.equal(resolveReportType({ titre: 'Rapport existant' }), REPORT_TYPES.TECHNICAL);
  assert.equal(resolveReportType(null), REPORT_TYPES.TECHNICAL);
});

test('seul le type habitologie explicite ouvre le parcours leger', () => {
  assert.equal(resolveReportType({ report_type: REPORT_TYPES.HABITOLOGIE }), REPORT_TYPES.HABITOLOGIE);
  assert.equal(resolveReportType({ report_type: 'type-inconnu' }), REPORT_TYPES.TECHNICAL);
});

test('les metadonnees sont ajoutees sans modifier le rapport source', () => {
  const source = { titre: 'Rapport source' };
  const result = applyReportMetadata(source, REPORT_TYPES.HABITOLOGIE);

  assert.deepEqual(source, { titre: 'Rapport source' });
  assert.deepEqual(result, {
    titre: 'Rapport source',
    report_type: REPORT_TYPES.HABITOLOGIE,
    schema_version: REPORT_SCHEMA_VERSION,
  });
});

test('le parcours habitologie expose exactement les six etapes metier', () => {
  assert.deepEqual(HABITOLOGIE_STEPS, [
    'Client',
    'Bien immobilier',
    'Risques',
    'Analyse',
    'Aides',
    'Synthese',
  ]);
});

test('un nouveau rapport habitologie initialise un schema versionne complet', () => {
  const report = createHabitologieReport('2026-09-10');

  assert.equal(report.report_type, REPORT_TYPES.HABITOLOGIE);
  assert.equal(report.schema_version, REPORT_SCHEMA_VERSION);
  assert.equal(report.date_visite, '2026-09-10');
  assert.deepEqual(Object.keys(report.habitologie), [
    'client',
    'bien',
    'risques',
    'analyse',
    'aides',
    'synthese',
  ]);
});

test('la reprise complete les sections manquantes sans perdre les donnees', () => {
  const report = normalizeHabitologieReport({
    report_type: REPORT_TYPES.HABITOLOGIE,
    reference_dossier: 'HAB-001',
    habitologie: { client: { nom: 'Famille Exemple' } },
  });

  assert.equal(report.reference_dossier, 'HAB-001');
  assert.equal(report.habitologie.client.nom, 'Famille Exemple');
  assert.deepEqual(report.habitologie.bien, {});
  assert.equal(report.schema_version, REPORT_SCHEMA_VERSION);
});

test('la reprise ignore les sections mal formees au lieu de les propager', () => {
  const report = normalizeHabitologieReport({
    report_type: REPORT_TYPES.HABITOLOGIE,
    habitologie: { client: null, bien: 'valeur-invalide' },
  });

  assert.deepEqual(report.habitologie.client, {});
  assert.deepEqual(report.habitologie.bien, {});
});
