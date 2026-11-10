import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const requireBrowser = createRequire(new URL('../../avereo-app-saisie-unique/frontend/package.json', import.meta.url));
const { chromium } = requireBrowser('playwright');
const dist = new URL('../frontend/dist/', import.meta.url);
const fixture = JSON.parse(await readFile(new URL('fixtures/phase-toggle.json', import.meta.url), 'utf8'));

test('le partage porte sur le seul dossier ouvert et la copie importée crée son propre rapport', async t => {
  const browser = await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH});
  t.after(() => browser.close());
  const page = await browser.newPage();
  const writes = [];
  const reads = [];
  const confidential = 'SOURCE-PRIVEE-RECETTE';
  await page.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (url.origin !== 'http://127.0.0.1') return route.abort();
    const reply = data => route.fulfill({json:{ok:true,...data}});
    if (url.pathname === '/api/auth.php') return reply({auth:{mode:'connect_gateway'},user:{name:'Test'}});
    if (url.pathname === '/api/reports.php') {
      if (route.request().method() === 'POST') {
        writes.push(route.request().postDataJSON());
        return reply({report:{id:'nouvelle-copie'}});
      }
      const id = url.searchParams.get('id');
      if (id) {
        reads.push(id);
        return reply({report:{id,payload:{...fixture, titre:confidential, signature:confidential}}});
      }
      return reply({reports:[{id:'original', title:'Premier dossier'}, {id:'autre',title:'Autre dossier'}]});
    }
    return route.fulfill({path:fileURLToPath(new URL(url.pathname === '/' ? 'index.html' : url.pathname.slice(1), dist))});
  });
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', {value: () => true});
    Object.defineProperty(navigator, 'share', {value: async ({files}) => {
      if (files.length !== 1) throw new Error('Nombre de fichiers inattendu');
      throw new DOMException('Annulé', 'AbortError');
    }});
  });
  await page.goto('http://127.0.0.1/');
  await page.locator('.online-report-list li').filter({hasText:'Premier dossier'}).getByRole('button',{name:'Ouvrir'}).click();
  await page.getByRole('navigation',{name:'Navigation du rapport'}).getByRole('button',{name:/Export$/}).click();
  await page.getByRole('button',{name:'Partager une copie pour les tests'}).click();
  await page.getByRole('button',{name:'Choisir un destinataire'}).click();
  await page.getByText('Partage annulé.',{exact:true}).waitFor();
  const download = page.waitForEvent('download');
  await page.getByRole('button',{name:'Télécharger la copie de test'}).click();
  const file = await download;
  assert.equal(file.suggestedFilename(), 'rapport-copie-test.json');
  const path = await file.path();
  const text = await readFile(path,'utf8');
  const copy = JSON.parse(text);
  assert.equal(copy.observations.length, 3);
  assert.ok(!text.includes(confidential) && !text.includes('onlineReportId') && !text.includes('data:image'));
  assert.deepEqual(reads,['original']);
  assert.equal(writes.length,0);
  const chooser = page.waitForEvent('filechooser');
  await page.getByRole('button',{name:'Import JSON',exact:true}).click();
  await (await chooser).setFiles({name:file.suggestedFilename(),mimeType:'application/json',buffer:Buffer.from(text)});
  await page.getByText('Brouillon importe.',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Enregistrer en ligne',exact:true}).click();
  await page.getByText('Rapport sauvegarde en ligne.',{exact:true}).waitFor();
  assert.equal(writes.length,1);
  assert.ok(!writes[0].id && !writes[0].report.onlineReportId);
  assert.equal(writes[0].report.reference_dossier,copy.reference_dossier);
});
