import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
const require = createRequire(process.env.RAPPORT_REVIEW_BROWSER_PACKAGE);
const { chromium } = require('playwright');
const appRequire = createRequire(new URL('../frontend/package.json', import.meta.url));
const JSZip = appRequire('jszip');
const origin = process.env.RAPPORT_REVIEW_ORIGIN || 'http://127.0.0.1:5260';
assert.equal(new URL(origin).hostname, '127.0.0.1');
const output = resolve(process.env.RAPPORT_REVIEW_OUTPUT || '.local/review-preparation'); await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
const page = await context.newPage(); page.setDefaultTimeout(15000);
const errors = [], checks = []; page.on('pageerror', e => errors.push(e.message));
await page.route('**/*', route => new URL(route.request().url()).origin === origin ? route.continue() : route.abort());
async function step(name) { await page.getByRole('navigation', { name: 'Navigation du rapport', exact: true }).getByRole('button', { name: new RegExp(name) }).click(); }
async function download(name, path) {
  const pending = page.waitForEvent('download'); await page.getByRole('button', { name, exact: true }).click();
  await (await pending).saveAs(path);
}
try {
  await page.goto(origin + '/fixture/'); await page.getByRole('link', { name: 'Compte fictif A', exact: true }).click();
  await page.getByLabel('Choisir un dossier JSON ou une copie privée Passeport', { exact: true }).setInputFiles(fileURLToPath(new URL('./fixtures/dossier-complet.json', import.meta.url)));
  await page.getByRole('button', { name: 'Charger le dossier complet', exact: true }).click();
  await step('Export');
  const panel = page.locator('details').filter({ has: page.locator('summary', { hasText: 'Demander une relecture experte dans Passeport Immo' }) });
  await panel.locator('summary').click();
  await page.getByRole('button', { name: '1. Préparer les deux Word pour relecture', exact: true }).click();
  await page.getByRole('button', { name: 'Télécharger le Word expert', exact: true }).waitFor();
  checks.push('Préparation des deux Word depuis le dossier complet fictif');
  const sourcePdf = Buffer.from('%PDF-1.4\nFixture de transport uniquement\n%%EOF');
  const clientPath = resolve(output, 'transport-client.pdf'), expertPath = resolve(output, 'transport-expert.pdf');
  await writeFile(clientPath, sourcePdf); await writeFile(expertPath, sourcePdf);
  await page.getByRole('button', { name: /Contrôle final et signature/ }).click();
  await page.getByLabel('Nom du signataire', { exact: true }).fill('Signataire revu dans Rapport');
  await panel.getByLabel('PDF expert de cette version').setInputFiles(expertPath); await panel.getByLabel('PDF client de cette version').setInputFiles(clientPath);
  await page.getByRole('button', { name: '2. Préparer la demande pour Passeport Immo', exact: true }).click();
  await page.getByText('Le dossier a changé. Préparez à nouveau les Word et leurs PDF avant de soumettre cette version.', { exact: true }).waitFor();
  checks.push('Modification du dossier détectée avant constitution du paquet de revue');
  await page.getByRole('button', { name: '1. Préparer les deux Word pour relecture', exact: true }).click();
  const expertWord = resolve(output, 'rapport-expert.docx'), clientWord = resolve(output, 'rapport-client.docx');
  await download('Télécharger le Word expert', expertWord); await download('Télécharger le Word client', clientWord);
  for (const path of [expertWord, clientWord]) assert.ok((await JSZip.loadAsync(await readFile(path))).file('word/document.xml'));
  checks.push('Deux vrais DOCX téléchargés depuis la version actualisée');
  await panel.getByLabel('PDF expert de cette version').setInputFiles(expertPath); await panel.getByLabel('PDF client de cette version').setInputFiles(clientPath);
  const packagePath = resolve(output, 'rapport.review.avereo.zip'); await download('2. Préparer la demande pour Passeport Immo', packagePath);
  const zip = await JSZip.loadAsync(await readFile(packagePath)); const manifest = JSON.parse(await zip.file('manifest.json').async('string'));
  assert.equal(manifest.schema, 'avereo-rapport-review'); assert.equal(manifest.validatedByProfessional, false);
  const report = JSON.parse(await zip.file('dossier-rapport.json').async('string'));
  const fixture = JSON.parse(await readFile(new URL('./fixtures/dossier-complet.json', import.meta.url), 'utf8'));
  assert.equal(report.nom_signataire, 'Signataire revu dans Rapport'); assert.equal(report.observations.length, fixture.observations.length);
  assert.equal(report.reviewSeriesId, manifest.seriesId); assert.ok(report.signature);
  assert.deepEqual(await zip.file('rapport-expert.docx').async('nodebuffer'), await readFile(expertWord));
  assert.deepEqual(await zip.file('rapport-client.docx').async('nodebuffer'), await readFile(clientWord));
  checks.push(`Paquet non validé complet : ${report.observations.length} constats, signature, deux Word exacts et PDF joints`);
  await page.screenshot({ path: resolve(output, 'preparation-rapport-desktop.png'), fullPage: true });
  assert.deepEqual(errors, []);
  await writeFile(resolve(output, 'browser-receipt.json'), JSON.stringify({ checks, pageErrors: errors, data: 'fictitious', pdfContentQualification: false, hostedSsoQualified: false }, null, 2));
  console.log(JSON.stringify({ browserChecks: checks.length, pageErrors: errors.length }));
} catch (error) {
  await page.screenshot({ path: resolve(output, 'failure.png'), fullPage: true }).catch(() => {});
  await writeFile(resolve(output, 'failure.txt'), JSON.stringify({ error: error.message, pageErrors: errors, text: await page.locator('body').innerText() }, null, 2)); throw error;
} finally { await browser.close(); }
