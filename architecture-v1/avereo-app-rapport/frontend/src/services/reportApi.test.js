import test from 'node:test';
import assert from 'node:assert/strict';
import { loadOnlineReport, saveOnlineReport, downloadOnlineReport } from './reportApi.js';

test('la réouverture refuse une réponse contenant seulement les métadonnées', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ ok: true, report: { id: 'a'.repeat(32), payload: { updatedAt: '2026-11-13' } } })));
  await assert.rejects(loadOnlineReport('a'.repeat(32), ''), /dossier complet/);
});
test('la sauvegarde envoie tout le dossier, son identifiant explicite et le signal d’annulation', async t => {
  const report = { observations: [{ observations: 'Constat conservé', photos: [{ src: 'data:image/png;base64,AQID' }] }], signature: 'signature conservée' };
  const controller = new AbortController();
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.deepEqual(JSON.parse(options.body), { id: '', report });
    assert.equal(options.signal, controller.signal);
    assert.equal(options.credentials, 'same-origin');
    return new Response(JSON.stringify({ ok: true, report: { id: 'b'.repeat(32), content: { observations: 1, photos: 1 } } }));
  });
  assert.equal((await saveOnlineReport(report, '', '', { signal: controller.signal })).content.photos, 1);
});
test('une écriture non confirmée garde l’identifiant pour éviter une nouvelle ligne au prochain envoi', async t => {
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ ok: false, error: 'report_write_unconfirmed', reportId: 'b'.repeat(32), message: 'Confirmation manquante' }), { status: 409 }));
  await assert.rejects(saveOnlineReport({ observations: [] }, ''), error => error.reportId === 'b'.repeat(32) && error.code === 'report_write_unconfirmed');
});
test('le téléchargement complet utilise une lecture authentifiée et conserve le fichier reçu', async t => {
  const raw = '{"observations":[],"compteur":9007199254740993}';
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(raw))), b => b.toString(16).padStart(2, '0')).join('');
  t.mock.method(globalThis, 'fetch', async (url, options) => {
    assert.ok(url.includes('download=1'));
    assert.equal(options.headers.Authorization, 'Bearer jeton-local-fictif');
    assert.equal(options.credentials, 'same-origin');
    assert.equal(options.redirect, 'error');
    return new Response(raw, { headers: { 'Content-Disposition': 'attachment; filename="rapport.json"', 'X-Avereo-Payload-Sha256': hash } });
  });
  assert.equal(await (await downloadOnlineReport('a'.repeat(32), 'jeton-local-fictif')).blob.text(), raw);
});
