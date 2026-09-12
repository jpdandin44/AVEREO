import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildGeorisquesRiskSummaryUrl,
  normalizeGeorisquesRiskSummary,
  riskStatusTone,
  safeGeorisquesReportUrl,
} from './georisquesRiskSummary.js';

test('construit la requete officielle avec longitude puis latitude', () => {
  assert.equal(
    buildGeorisquesRiskSummaryUrl('2.2301207', '48.8376847'),
    'https://www.georisques.gouv.fr/api/v1/resultats_rapport_risque?latlon=2.2301207%2C48.8376847',
  );
});

test('refuse les coordonnees absentes ou hors limites', () => {
  assert.equal(buildGeorisquesRiskSummaryUrl('', 48.8), null);
  assert.equal(buildGeorisquesRiskSummaryUrl(181, 48.8), null);
  assert.equal(buildGeorisquesRiskSummaryUrl(2.2, -91), null);
});

test('ne conserve que les risques presents et leurs statuts officiels', () => {
  const summary = normalizeGeorisquesRiskSummary(
    {
      adresse: { libelle: '38 Rue de Bellevue' },
      commune: { libelle: 'Boulogne-Billancourt' },
      url: 'https://example.test/rapport',
      risquesNaturels: {
        inondation: {
          present: true,
          libelle: 'Inondation',
          libelleStatutAdresse: 'Risque Existant',
          libelleStatutCommune: 'Risque Existant',
        },
        avalanche: { present: false, libelle: 'Avalanche' },
      },
      risquesTechnologiques: {},
    },
    '2026-09-12T10:00:00.000Z',
  );

  assert.equal(summary.naturels.length, 1);
  assert.equal(summary.naturels[0].label, 'Inondation');
  assert.equal(summary.naturels[0].addressStatus, 'Risque Existant');
  assert.equal(summary.fetchedAt, '2026-09-12T10:00:00.000Z');
});

test('classe les statuts sans confondre concerne et non concerne', () => {
  assert.equal(riskStatusTone('Risque non Concerné'), 'neutral');
  assert.equal(riskStatusTone('Risque Existant - faible'), 'low');
  assert.equal(riskStatusTone('Risque Existant - important'), 'high');
});

test('n ouvre que les rapports officiels Georisques', () => {
  assert.equal(
    safeGeorisquesReportUrl('https://www.georisques.gouv.fr/mes-risques/rapport2'),
    'https://www.georisques.gouv.fr/mes-risques/rapport2',
  );
  assert.equal(safeGeorisquesReportUrl('javascript:alert(1)'), '');
  assert.equal(safeGeorisquesReportUrl('https://example.test/rapport'), '');
});
