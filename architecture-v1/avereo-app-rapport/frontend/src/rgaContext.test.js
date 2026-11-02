import test from 'node:test';
import assert from 'node:assert/strict';
import { applyRgaContext, buildRgaMapUrl, lambert93, RGA_MESSAGE, readRgaTransfer } from './rgaContext.js';
import { buildRgaCartographyHtml } from './reportHtml.js';
const report = { cadastre: { lon: 3, lat: 46.5 }, observations: [{ titre: 'Conserver' }], risques: {} };
const message = { type: RGA_MESSAGE, lon: 3, lat: 46.5, fetchedAt: '2026-01-01T10:00:00Z',
  payload: { risquesNaturels: { argiles: { present: true, libelle: 'Argiles', libelleStatutAdresse: 'Exposition forte' } }, risquesTechnologiques: {} } };
const cartography = { lon: 3, lat: 46.5, status: 'available', level: 'Moyen', department: '63',
  dataset: 'AleaRG_2025_Fxx_L93.shp', millesime: '2026', fetchedAt: '2026-01-01T10:00:00Z' };
test('la lecture cartographique fonctionne sans API et ne remplace pas la synthèse officielle', () => {
  const updated = applyRgaContext(report, { ...message, payload: null, cartography });
  assert.equal(updated.risques, report.risques);
  assert.equal(updated.rga_cartographie.level, 'Moyen');
  const html = buildRgaCartographyHtml(updated);
  assert.match(html, /Exposition moyenne \(indicative\)/);
  assert.match(html, /20 m/);
  assert.match(html, /ne signifie pas absence de risque/i);
  assert.equal(buildRgaCartographyHtml({ ...updated, cadastre: { lon: 4, lat: 46.5 } }), '');
  assert.equal(applyRgaContext(report, { ...message, payload: null, cartography: { ...cartography, level: 'Nul' } }), null);
});
test('le repère Lambert conserve le faux centre connu EPSG:2154', () => {
  const [x, y] = lambert93(3, 46.5);
  assert.ok(Math.abs(x - 700000) < .001);
  assert.ok(Math.abs(y - 6600000) < .001);
  assert.equal(lambert93('', 46), null);
});
test('le lien RGA place adresse et point dans le fragment et refuse les coordonnées absentes', () => {
  const url = new URL(buildRgaMapUrl({ ...report, adresse_logement: '<maison>& été' }), 'https://rapport.example');
  assert.equal(url.search, '');
  assert.equal(new URLSearchParams(url.hash.slice(1)).get('adresse'), '<maison>& été');
  assert.equal(buildRgaMapUrl({}), '/rga/carte.php');
});
test('la reprise des risques conserve observations et point puis traverse un export JSON', () => {
  const updated = applyRgaContext(report, message);
  assert.equal(updated.observations, report.observations);
  assert.equal(updated.cadastre, report.cadastre);
  assert.equal(JSON.parse(JSON.stringify(updated)).risques.rga.addressStatus, 'Exposition forte');
});
test('les autres biens, données incomplètes, dates futures et consultations anciennes sont refusés', () => {
  for (const change of [{ lon: 4 }, { lat: null }, { type: 'other' }, { fetchedAt: 'bad' },
    { fetchedAt: '2999-01-01' }, { payload: {} }]) assert.equal(applyRgaContext(report, { ...message, ...change }), null);
  assert.equal(applyRgaContext({ ...report, risques: { fetchedAt: '2026-01-02' } }, message), null);
  assert.equal(applyRgaContext({ cadastre: {} }, message), null);
});
test('le transfert vers un nouveau dossier reste explicite et ne confirme pas le bien', () => {
  const imported = readRgaTransfer(JSON.stringify({ message, label: 'Adresse de test' }));
  assert.equal(imported.adresse_logement, 'Adresse de test');
  assert.equal(imported.localisation.confirmation, null);
  assert.equal(imported.risques.rga.addressStatus, 'Exposition forte');
  assert.equal(readRgaTransfer('{}'), null);
  assert.equal(readRgaTransfer('x'.repeat(250001)), null);
  assert.equal(readRgaTransfer(JSON.stringify({ message: { ...message, payload: {} }, label: 'Adresse' })), null);
});
