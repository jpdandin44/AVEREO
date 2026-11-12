import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const { chromium } = createRequire(new URL('../../avereo-app-saisie-unique/frontend/package.json', import.meta.url))('playwright');
const dist = new URL('../frontend/dist/', import.meta.url);
test('télécharger un rapport délégué sans ouvrir le dossier dans le brouillon', async t => {
  const browser = await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH});
  t.after(() => browser.close());
  const page = await browser.newPage();
  const id = 'a'.repeat(32);
  const bytes = '{"reference_dossier":"MISSION-FICTIVE","observations":[],"nombre":9007199254740993}';
  let grant = true;
  let exportRequests = 0;
  await page.route('**/*', async route => {
    const req = route.request(), url = new URL(req.url());
    if (url.origin !== 'http://127.0.0.1') return route.abort();
    const ok = body => route.fulfill({json:{ok:true,...body}});
    if (url.pathname === '/api/auth.php') return ok({auth:{mode:'connect_gateway'},user:{name:'Fictif'}});
    if (url.pathname === '/api/reports.php') return ok({reports:[],organizationExportsAvailable:true});
    if (url.pathname === '/api/exports.php') {
      if (req.method() === 'GET') return ok({reports:[{id,organizationId:10,reference:'MISSION-FICTIVE'}]});
      assert.deepEqual(req.postDataJSON(),{id,purpose:'continuite'});
      assert.equal(req.headers()['x-avereo-export'],'1');
      exportRequests++;
      if (exportRequests === 1) return route.abort('connectionreset');
      if (!grant) return route.fulfill({status:404,json:{ok:false}});
      return route.fulfill({headers:{'Content-Type':'application/json','Content-Disposition':'attachment; filename="dossier.json"'},body:bytes});
    }
    return route.fulfill({path:fileURLToPath(new URL(url.pathname==='/'?'index.html':url.pathname.slice(1),dist))});
  });
  await page.addInitScript(() => localStorage.setItem('avereo-rapport-draft-v2','{"titre":"Brouillon fictif"}'));
  await page.goto('http://127.0.0.1/');
  const region = page.getByRole('region',{name:'Exports autorisés par organisation'});
  const button = region.getByRole('button',{name:'Télécharger le JSON complet'});
  await button.waitFor();
  assert.equal(await button.isEnabled(),false);
  await region.getByLabel('Motif de l’export').selectOption('continuite');
  await button.click();
  const alert = region.getByRole('alert');
  await alert.waitFor();
  assert.match(await alert.innerText(), /Vérifiez vos téléchargements/);
  assert.equal(exportRequests, 1);
  assert.equal(await button.isEnabled(), true);
  const [download] = await Promise.all([page.waitForEvent('download'),button.click()]);
  assert.equal(exportRequests, 2);
  assert.equal(await alert.count(), 0);
  assert.equal(await readFile(await download.path(),'utf8'),bytes);
  assert.equal(download.suggestedFilename(),`rapport-${id}.json`);
  grant = false;
  await button.click();
  await region.getByRole('alert').waitFor();
  assert.equal(await alert.innerText(), 'Export refusé ou dossier indisponible.');
  assert.equal(await page.evaluate(()=>localStorage.getItem('avereo-rapport-draft-v2')),'{"titre":"Brouillon fictif"}');
});
