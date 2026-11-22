import test from 'node:test';
import assert from 'node:assert/strict';
import { independentReport, isTestStructure, readReportFile, reportContentSummary, requireReportContent, verifyCompleteDownload } from './reportFiles.js';
import { createTestReportCopy } from './testReportCopy.js';

const report = {
  titre: 'Dossier fictif complet', reference_dossier: 'TEST-COMPLET', onlineReportId: 'a'.repeat(32),
  ecoute: { attentes: 'Garder le calme et le confort.' }, signature: 'data:image/png;base64,AQID',
  plans: [{ id: 'plan-1', image: 'data:image/png;base64,BAUG' }],
  decision: { liens: [{ constatId: 'obs-1', attentes: ['attente-1'] }] },
  observations: [{ id: 'obs-1', observations: 'Constat réel de la fixture', explications: 'Détail https://example.org/',
    actions: 'Conseil conservé', reperes: [{ planId: 'plan-1' }], photos: [{ id: 'photo-1', src: 'data:image/png;base64,BwgJ', extension_future: { value: 1 } }] }],
  futur: { valeurs: [false, null, '9007199254740993'], texte: '<script>non exécuté</script>' },
};
const digest = async text => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))), b => b.toString(16).padStart(2, '0')).join('');
const download = async (text, headers = {}) => new Response(text, { headers: {
  'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename="rapport.json"',
  'X-Avereo-Payload-Sha256': await digest(text), ...headers,
} });

test('le JSON complet conserve textes, photos, plans, signature et données futures', () => {
  assert.deepEqual(readReportFile(JSON.stringify(report)), report);
  assert.deepEqual(reportContentSummary(report), { observations: 1, photos: 1, plans: 1, signature: true, structureOnly: false });
});
test('un import est indépendant sans casser les références internes ni modifier le source', () => {
  const before = structuredClone(report);
  const copy = independentReport(report);
  assert.equal(copy.onlineReportId, undefined);
  assert.deepEqual(copy, Object.fromEntries(Object.entries(report).filter(([key]) => key !== 'onlineReportId')));
  copy.observations[0].observations = 'Modification du destinataire';
  assert.deepEqual(report, before);
});
test('un entier hors précision peut être archivé mais ne sera jamais arrondi silencieusement à l’import', () => {
  const value = readReportFile('{"observations":[],"inconnu":9007199254740993}');
  assert.throws(() => independentReport(value), /entier trop grand/);
});
test('l’enveloppe de lecture serveur fournit le contenu et jamais son résumé', () => {
  assert.deepEqual(readReportFile(JSON.stringify({ ok: true, report: { id: 'a'.repeat(32), updatedAt: '2026-11-13', payload: report } })), report);
  for (const value of [{ updatedAt: '2026-11-13' }, { id: 'a'.repeat(32), payloadBytes: 42 }, { ok: true, report: { id: 'a' } }]) {
    assert.throws(() => readReportFile(JSON.stringify(value)), /dossier complet/);
  }
});
test('JSON corrompu, primitives et observations mal formées ne remplacent aucun brouillon', () => {
  assert.throws(() => readReportFile('{'), /illisible/);
  for (const value of [null, [], 'abc', { observations: {} }, { observations: [null] }, { observations: [{ photos: {} }] }]) {
    assert.throws(() => requireReportContent(value), /brouillon actuel est conservé/);
  }
  assert.deepEqual(requireReportContent({ observations: [] }), { observations: [] });
  assert.deepEqual(reportContentSummary({ observations: [{ photos: null }] }), { observations: 1, photos: 0, plans: 0, signature: false, structureOnly: false });
});
test('les anciennes copies de test reçues sont reconnues sans confondre un vrai dossier TEST', () => {
  const old = { titre: 'Copie pour les tests', reference_dossier: 'TEST-FICTIF', proprietaire: 'Client fictif',
    observations: Array.from({ length: 12 }, () => ({ observations: 'Constat de test', photos: [] })) };
  assert.equal(isTestStructure(old), true);
  assert.equal(isTestStructure(report), false);
  assert.equal(isTestStructure({ ...old, observations: [{ observations: 'Texte conservé', photos: [] }] }), false);
});
test('une nouvelle structure reste explicitement marquée et ne divulgue aucun contenu complet', () => {
  const copy = createTestReportCopy(report);
  assert.equal(copy.copie_test, true);
  assert.equal(isTestStructure(copy), true);
  assert.equal(copy.signature, undefined);
  assert.deepEqual(copy.observations[0].photos, []);
  assert.equal(copy.observations[0].observations, 'Constat de test');
});
test('le téléchargement garde les octets, y compris un nombre JSON hors précision JavaScript', async () => {
  const raw = '{"observations":[],"inconnu":9007199254740993,"texte":"é / \\u2028"}';
  const { blob, summary } = await verifyCompleteDownload(await download(raw));
  assert.equal(await blob.text(), raw);
  assert.equal(summary.observations, 0);
});
test('un fichier reçu altéré ou sans empreinte ne constitue pas une sauvegarde vérifiée', async () => {
  await assert.rejects(verifyCompleteDownload(await download(JSON.stringify(report), { 'X-Avereo-Payload-Sha256': '0'.repeat(64) })), /diffère/);
  await assert.rejects(verifyCompleteDownload(new Response('{}', { headers: { 'Content-Disposition': 'attachment;' } })), /vérifié/);
});
test('une erreur, une page de connexion ou un résumé seul ne sont pas téléchargés comme dossier', async () => {
  await assert.rejects(verifyCompleteDownload(new Response('{}', { status: 403 })), /session expirée/);
  await assert.rejects(verifyCompleteDownload(new Response('<html>Connexion</html>')), /session expirée/);
  await assert.rejects(verifyCompleteDownload(await download('{"updatedAt":"2026-11-13"}')), /dossier complet/);
});
