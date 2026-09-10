import assert from 'node:assert/strict';
import test from 'node:test';

import { buildGeorisquesReportUrl } from './georisquesReport.js';

test('construit le rapport officiel Georisques dans l ordre longitude latitude', () => {
  assert.equal(
    buildGeorisquesReportUrl(2.2381639, 48.8327417),
    'https://www.georisques.gouv.fr/api/v1/rapport_pdf?latlon=2.2381639%2C48.8327417',
  );
});

test('accepte des coordonnees numeriques fournies sous forme de texte', () => {
  assert.equal(
    buildGeorisquesReportUrl('5.96343', '45.5692'),
    'https://www.georisques.gouv.fr/api/v1/rapport_pdf?latlon=5.96343%2C45.5692',
  );
});

test('refuse des coordonnees absentes ou hors limites', () => {
  assert.equal(buildGeorisquesReportUrl('', 48.8), null);
  assert.equal(buildGeorisquesReportUrl(2.2, null), null);
  assert.equal(buildGeorisquesReportUrl(181, 48.8), null);
  assert.equal(buildGeorisquesReportUrl(2.2, 91), null);
});
