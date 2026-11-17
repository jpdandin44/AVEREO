import test from 'node:test';
import assert from 'node:assert/strict';
import { readConnectedMissionProfile } from './connectedMissionProfile.js';
import { withMissionDefault, decisionProjectionLabels, missionProfileLabel } from './reportProfiles.js';
import { createTestReportCopy } from './testReportCopy.js';

const user = { provider: 'avereo_connect', id: '42' };
const portal = 'https://connect-preprod.avereo.fr';

test('the connected default is read freshly, with credentials, for the same authenticated account only', async () => {
  for (const profile of ['habitologue', 'architecte', 'maitre_oeuvre', '']) {
    const result = await readConnectedMissionProfile({ portal, user, fetchImpl: async (url, options) => {
      assert.equal(url, portal + '/api/v1/me/preferences?application=rapport');
      assert.equal(options.credentials, 'include'); assert.equal(options.cache, 'no-store');
      assert.equal(options.referrerPolicy, 'no-referrer'); assert.ok(options.signal);
      return { ok: true, json: async () => ({ data: { accountId: 42, professionalProfile: profile } }) };
    } });
    assert.equal(result.profile, profile); assert.ok(result.notice);
  }
});

test('missing service, old backend, wrong account and invalid profiles retain an explicit manual choice', async () => {
  for (const data of [{}, { accountId: 43, professionalProfile: 'architecte' },
    { accountId: 42, professionalProfile: '<script>' }, { accountId: 42, professionalProfile: [] }]) {
    const result = await readConnectedMissionProfile({ portal, user, fetchImpl: async () => ({ ok: true, json: async () => ({ data }) }) });
    assert.equal(result.profile, ''); assert.match(result.notice, /n’a pas pu/);
  }
  const failed = await readConnectedMissionProfile({ portal, user, fetchImpl: async () => { throw Error('Offline'); } });
  assert.equal(failed.profile, ''); assert.match(failed.notice, /Choisissez/);
});

test('non-CONNECT identities and a missing validated portal cause no request', async () => {
  for (const params of [{ user: { provider: 'drupal', id: '42' }, portal }, { user, portal: null }, { user: null, portal }]) {
    const value = await readConnectedMissionProfile({ ...params, fetchImpl: () => assert.fail('Unexpected network request') });
    assert.equal(value.profile, '');
  }
});

test('a slow read is aborted without preventing a manual new mission', async () => {
  const result = await readConnectedMissionProfile({ portal, user, timeoutMs: 5, fetchImpl: async (_url, { signal }) =>
    new Promise((_resolve, reject) => signal.addEventListener('abort', () => reject(Error('Timed out')))) });
  assert.equal(result.profile, ''); assert.match(result.notice, /Dossier/);
});

test('an account default never rewrites an existing profile, business data or unknown historical value', () => {
  const report = { profil_metier: '', decision: { actions: [{ id: 'stable', planning_projet: { charge: '2' } }], option_a: { nom: 'Variante rédigée' } } };
  const before = structuredClone(report);
  const fresh = withMissionDefault(report, 'architecte');
  assert.equal(fresh.profil_metier, 'architecte'); assert.deepEqual(fresh.decision, report.decision); assert.deepEqual(report, before);
  for (const value of ['habitologue', 'architecte', 'maitre_oeuvre', 'historique-inconnu']) {
    const existing = { ...report, profil_metier: value };
    assert.equal(withMissionDefault(existing, 'maitre_oeuvre'), existing);
  }
  assert.equal(withMissionDefault(report, 'admin'), report);
});

test('recognized professions survive a fictitious copy while unrecognized private values remain excluded', () => {
  for (const profile of ['habitologue', 'architecte', 'maitre_oeuvre']) {
    assert.equal(createTestReportCopy({ profil_metier: profile }).profil_metier, profile);
    assert.notEqual(missionProfileLabel({ profil_metier: profile }), 'Parcours actuel');
  }
  assert.equal(createTestReportCopy({ profil_metier: 'private-unrecognized-value' }).profil_metier, undefined);
  assert.deepEqual(decisionProjectionLabels({}), decisionProjectionLabels({ profil_metier: 'private-unrecognized-value' }));
});
