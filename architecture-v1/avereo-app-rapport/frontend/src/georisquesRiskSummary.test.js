import assert from 'node:assert/strict';
import test from 'node:test';

import {
  buildGeorisquesRiskSummaryUrl,
  normalizeGeorisquesRiskSummary,
  riskStatusTone,
  safeGeorisquesReportUrl,
  rgaRisk,
  fetchGeorisquesRiskPayload,
  previousRisksAtPoint,
} from './georisquesRiskSummary.js';

const completePayload = { risquesNaturels: { rga: { present: true, libelleStatutAdresse: 'Exposition moyenne' } }, risquesTechnologiques: {} };
const successfulResponse = () => ({ ok: true, json: async () => structuredClone(completePayload) });

test('retries interrupted connections with bounded spacing and returns only a validated response', async () => {
  let calls = 0;
  const delays = [];
  const result = await fetchGeorisquesRiskPayload(1.23, 43.35, {
    fetchImpl: async (url, options) => {
      assert.match(url, /latlon=1.23%2C43.35$/);
      assert.equal(options.referrerPolicy, 'no-referrer');
      if (++calls < 3) throw new TypeError('Connection reset');
      return successfulResponse();
    }, wait: async (delay) => delays.push(delay),
  });
  assert.equal(calls, 3);
  assert.deepEqual(delays, [1200, 2400]);
  assert.deepEqual(result.payload, completePayload);
  assert.ok(Number.isFinite(Date.parse(result.fetchedAt)));
});

test('a persistent interruption stops after three attempts without returning empty risks', async () => {
  let calls = 0;
  await assert.rejects(fetchGeorisquesRiskPayload(1.23, 43.35, {
    fetchImpl: async () => { calls++; throw new TypeError('Connection reset'); }, wait: async () => {},
  }), /Connection reset/);
  assert.equal(calls, 3);
});

test('does not retry invalid payloads, client errors or a long provider cooldown', async () => {
  for (const response of [
    { ok: true, json: async () => ({}) },
    { ok: false, status: 403 },
    { ok: false, status: 429, headers: { get: () => '10' } },
  ]) {
    let calls = 0;
    await assert.rejects(fetchGeorisquesRiskPayload(1.23, 43.35, {
      fetchImpl: async () => { calls++; return response; }, wait: async () => assert.fail('Unexpected retry'),
    }));
    assert.equal(calls, 1);
  }
});

test('respects a short provider cooldown before retrying a 429', async () => {
  let calls = 0;
  const delays = [];
  await fetchGeorisquesRiskPayload(1.23, 43.35, {
    fetchImpl: async () => ++calls === 1 ? { ok: false, status: 429, headers: { get: () => '3' } } : successfulResponse(),
    wait: async delay => delays.push(delay),
  });
  assert.deepEqual(delays, [3000]);
  assert.equal(calls, 2);
});

test('cancelling a view prevents further attempts and discards late responses', async () => {
  for (const lateResponse of [false, true]) {
    const controller = new AbortController();
    let calls = 0;
    await assert.rejects(fetchGeorisquesRiskPayload(1.23, 43.35, {
      signal: controller.signal,
      fetchImpl: async () => {
        calls++;
        if (lateResponse) { controller.abort(); return successfulResponse(); }
        throw new TypeError('Connection reset');
      }, wait: async () => controller.abort(),
    }), { name: 'AbortError' });
    assert.equal(calls, 1);
  }
});

test('a failed refresh retains the dated summary only for the exact same valid point', () => {
  const report = { cadastre: { lon: '1.23', lat: '43.35' }, risques: normalizeGeorisquesRiskSummary(completePayload, '2026-11-02T10:00:00Z') };
  const before = structuredClone(report);
  assert.equal(previousRisksAtPoint(report, 1.23, 43.35), report.risques);
  assert.equal(previousRisksAtPoint(report, 1.2301, 43.35).fetchedAt, '');
  assert.equal(previousRisksAtPoint({ ...report, cadastre: {} }, 1.23, 43.35).fetchedAt, '');
  assert.deepEqual(report, before);
});

test('RGA preserves official address and commune labels, source and date through JSON', () => {
  const result = normalizeGeorisquesRiskSummary({ risquesNaturels: { argiles: { present: true,
    libelle: 'Retrait-gonflement des argiles', libelleStatutAdresse: 'Exposition forte', libelleStatutCommune: 'Risque existant' } },
    risquesTechnologiques: {} }, '2026-10-24T10:00:00Z');
  const reopened = JSON.parse(JSON.stringify(result));
  assert.equal(rgaRisk(reopened).addressStatus, 'Exposition forte');
  assert.equal(rgaRisk(reopened).communeStatus, 'Risque existant');
  assert.equal(reopened.source, 'Géorisques API V1');
  assert.equal(reopened.fetchedAt, '2026-10-24T10:00:00Z');
});

test('missing RGA is not non-exposure, and explicit non-present labels are retained', () => {
  const empty = normalizeGeorisquesRiskSummary({ risquesNaturels: {}, risquesTechnologiques: {} });
  assert.equal(rgaRisk(empty), null);
  const nonPresent = normalizeGeorisquesRiskSummary({ risquesNaturels: { rga: { present: false,
    libelleStatutAdresse: 'Non concerné' } }, risquesTechnologiques: {} });
  assert.equal(rgaRisk(nonPresent).addressStatus, 'Non concerné');
  assert.equal(rgaRisk(nonPresent).communeStatus, 'Information non disponible');
  assert.equal(nonPresent.naturels.length, 0);
});

test('legacy report risks remain readable without inventing an API update', () => {
  const old = { fetchedAt: '2026-09-12T12:00:00Z', naturels: [{ key: 'argiles', label: 'Argiles',
    addressStatus: 'Risque existant', communeStatus: 'Risque existant' }] };
  assert.equal(rgaRisk(old), old.naturels[0]);
  assert.equal(old.fetchedAt, '2026-09-12T12:00:00Z');
});

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
