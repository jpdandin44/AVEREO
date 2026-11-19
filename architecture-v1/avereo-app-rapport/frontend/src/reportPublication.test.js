import { test } from 'node:test';
import assert from 'node:assert/strict';
import JSZip from 'jszip';
import { createPublication, readPublication } from './reportPublication.js';
import { blobSha256 } from './photoOriginals.js';
import { buildReportHtml, documentStatus } from './reportDelivery.js';

const id = 'a'.repeat(32), originalId = 'b'.repeat(32);
const bytes = new Blob(['original-photo'], { type: 'image/png' });
const report = () => ({ titre: 'Fictif', reference_dossier: 'RECETTE', onlineReportId: id, observations: [{ id: 'o1', observations: 'Constat', photos: [{ id: 'p1', src: 'data:image/png;base64,Y29waWU=', reportPhotoChoice: 'prepared', reportVersion: { preserved: true } }] }], ecoute: { notes: 'Notes privées à conserver' }, plans: [{ id: 'plan1', title: 'Plan fictif', kind: 'niveau', source: 'Recette', width: 1, height: 1, src: 'data:image/png;base64,cGxhbg==' }], signature: 'signature-fictive' });
const word = new Blob(['client-word']);

test('publication requires explicit professional confirmation and leaves source unchanged', async () => {
  const source = report(), before = structuredClone(source);
  await assert.rejects(createPublication(source, word), /Confirmez/);
  const { blob, manifest } = await createPublication(source, word, { validated: true, id });
  assert.equal(manifest.validatedByProfessional, true);
  const loaded = await readPublication(blob);
  const expected = structuredClone(source); delete expected.onlineReportId;
  assert.deepEqual(loaded, expected);
  assert.deepEqual(source, before);
});

test('private archive includes verified server originals and restores them without source account links', async () => {
  const source = report(), photo = source.observations[0].photos[0];
  photo.original = { id: originalId, reportId: id, sha256: await blobSha256(bytes), bytes: bytes.size, mime: 'image/png' };
  const before = structuredClone(source); let calls = 0;
  const { blob, manifest } = await createPublication(source, word, { validated: true, readOriginal: async (rid, p) => { calls++; assert.equal(rid, id); assert.equal(p.id, 'p1'); return bytes; } });
  assert.equal(calls, 1); assert.equal(manifest.originals.length, 1);
  const loaded = await readPublication(blob);
  assert.equal(loaded.observations[0].photos[0].src, 'data:image/png;base64,b3JpZ2luYWwtcGhvdG8=');
  assert.equal(loaded.observations[0].photos[0].original, undefined);
  assert.deepEqual(loaded.observations[0].photos[0].reportVersion, before.observations[0].photos[0].reportVersion);
  assert.deepEqual(loaded.plans, source.plans); assert.equal(loaded.signature, source.signature);
  assert.deepEqual(loaded.ecoute, source.ecoute); assert.deepEqual(source, before);
});

test('missing or mismatching original blocks publication instead of silently losing it', async () => {
  const source = report(); source.observations[0].photos[0].original = { id: originalId, reportId: id, sha256: await blobSha256(bytes), bytes: bytes.size, mime: 'image/png' };
  await assert.rejects(createPublication(source, word, { validated: true, readOriginal: async () => new Blob(['wrong']) }), /incomplète/);
  source.onlineReportId = 'c'.repeat(32);
  await assert.rejects(createPublication(source, word, { validated: true }), /autre dossier/);
});

test('tampering, extra entries and compressed archives are refused before replacing any draft', async () => {
  const { blob } = await createPublication(report(), word, { validated: true });
  for (const change of ['payload', 'extra', 'compression']) {
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    if (change === 'payload') zip.file('dossier-rapport.json', JSON.stringify({ observations: [] }));
    if (change === 'extra') zip.file('secret.json', '{}');
    const changed = new Blob([await zip.generateAsync({ type: 'uint8array', compression: change === 'compression' ? 'DEFLATE' : 'STORE' })]);
    await assert.rejects(readPublication(changed), /incomplète/);
  }
});

test('ordinary exports retain work status; only the confirmed snapshot receives final version status', () => {
  assert.equal(documentStatus(report()), 'Document de travail');
  assert.equal(documentStatus({ ...report(), publication: { id, validatedByProfessional: true } }), 'Version finalisée · aaaaaaaa');
  const client = { ...report(), livrable: { audience: 'client', synthese: 'Synthèse publique' }, publication: { id, validatedByProfessional: true } };
  assert.match(buildReportHtml(client), /Version finalisée/);
  assert.doesNotMatch(buildReportHtml(client), /Notes privées à conserver/);
});
