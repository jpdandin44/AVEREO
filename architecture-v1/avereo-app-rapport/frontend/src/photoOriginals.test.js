import test from 'node:test';
import assert from 'node:assert/strict';
import { attachOriginal, blobSha256, originalDownloadName, originalReference, photoBlob, preservePhotoOriginal, readPhotoOriginal } from './photoOriginals.js';

const reportId = 'a'.repeat(32);
const photo = { id: 'photo-1', name: 'fictive.png', src: 'data:image/png;base64,AQID', extra: 'conservé' };
const blob = photoBlob(photo);
const sha256 = await blobSha256(blob);
const original = { id: 'b'.repeat(32), reportId, sha256, bytes: 3, mime: 'image/png', name: photo.name };
const report = { onlineReportId: reportId, unrelated: { value: 1 }, observations: [{ id: 'obs-1', photos: [photo] }] };
const target = { reportId, observationId: 'obs-1', photoId: photo.id, src: photo.src };
const ok = value => new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } });

test('le téléchargement utilise une extension du type vérifié et un nom sans chemin', () => {
  assert.equal(originalDownloadName({ ...original, name: '../../photo.exe' }), 'photo.png');
  assert.equal(originalDownloadName({ ...original, name: 'C:\\visite\\détail\r\n.png' }), 'détail.png');
});

test('une référence importée ne désigne pas un original d’un autre dossier', () => {
  assert.equal(originalReference({ original }, 'c'.repeat(32)), null);
  assert.equal(originalReference({ original: { ...original, id: '../file' } }, reportId), null);
  assert.equal(originalReference({ original }, reportId), original);
});
test('rattachement sans toucher aux octets, identifiants ni valeurs inconnues', () => {
  const updated = attachOriginal(report, target, original);
  assert.notEqual(updated, report);
  assert.deepEqual(updated.observations[0].photos[0], { ...photo, original });
  assert.equal(updated.unrelated, report.unrelated);
  assert.equal(report.observations[0].photos[0].original, undefined);
  assert.deepEqual(JSON.parse(JSON.stringify(updated)), updated);
});
test('résultat tardif ignoré si dossier, constat, photo ou contenu ont changé', () => {
  for (const changed of [
    { ...report, onlineReportId: 'c'.repeat(32) },
    { ...report, observations: [] },
    { ...report, observations: [{ id: 'obs-1', photos: [] }] },
    { ...report, observations: [{ id: 'obs-1', photos: [{ ...photo, src: 'data:image/png;base64,BAUG' }] }] },
  ]) assert.equal(attachOriginal(changed, target, original), changed);
});
test('envoi individuel des octets exacts et contrôle de l’accusé serveur', async () => {
  const result = await preservePhotoOriginal(reportId, photo, { fetchImpl: async (url, options) => {
    assert.ok(url.endsWith('/photo-originals.php'));
    assert.equal(options.headers['X-Avereo-Photo'], '1');
    assert.equal(options.credentials, 'same-origin');
    assert.equal(options.redirect, 'error');
    assert.equal(options.body.get('sha256'), sha256);
    assert.deepEqual(new Uint8Array(await options.body.get('file').arrayBuffer()), Uint8Array.of(1, 2, 3));
    return ok({ ok: true, original });
  } });
  assert.deepEqual(result, original);
  assert.equal(photo.src, 'data:image/png;base64,AQID');
});
test('un accusé incohérent ne confirme jamais la conservation', async () => {
  for (const bad of [{ ...original, sha256: '0'.repeat(64) }, { ...original, bytes: 4 }, { ...original, reportId: 'c'.repeat(32) }]) {
    await assert.rejects(preservePhotoOriginal(reportId, photo, { fetchImpl: async () => ok({ ok: true, original: bad }) }), /confirmée/);
  }
});
test('refus de format, dépassement et annulation avant toute requête', async () => {
  const noRequest = () => assert.fail('aucun envoi autorisé');
  await assert.rejects(preservePhotoOriginal(reportId, { ...photo, src: 'https://exemple.invalid/photo.png' }, { fetchImpl: noRequest }));
  await assert.rejects(preservePhotoOriginal(reportId, photo, { maxBytes: 2, fetchImpl: noRequest }), /taille/);
  const c = new AbortController(); c.abort();
  await assert.rejects(preservePhotoOriginal(reportId, photo, { signal: c.signal, fetchImpl: noRequest }), { name: 'AbortError' });
});
test('réouverture privée avec contrôle complet des octets', async () => {
  const read = await readPhotoOriginal(reportId, { ...photo, original }, { fetchImpl: async (url, options) => {
    assert.ok(url.includes(`reportId=${reportId}`));
    assert.equal(options.credentials, 'same-origin');
    return new Response(blob);
  } });
  assert.equal(await blobSha256(read), sha256);
});
test('lecture altérée ou inter-dossier refusée', async () => {
  await assert.rejects(readPhotoOriginal(reportId, { ...photo, original }, { fetchImpl: async () => new Response(new Blob([Uint8Array.of(3, 2, 1)], { type: 'image/png' })) }), /correspond pas/);
  await assert.rejects(readPhotoOriginal('c'.repeat(32), { ...photo, original }, { fetchImpl: () => assert.fail() }), /ce dossier/);
});
test('session expirée et refus de stockage restent des erreurs explicites', async () => {
  for (const status of [403, 413, 503]) {
    await assert.rejects(preservePhotoOriginal(reportId, photo, { fetchImpl: async () => new Response('{}', { status }) }), error => error.status === status);
  }
  await assert.rejects(preservePhotoOriginal(reportId, photo, { fetchImpl: async () => new Response(
    JSON.stringify({ error: 'origin_refused', message: 'Origine de requête refusée.' }), { status: 403 },
  ) }), /Origine de requête refusée/);
});
