import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const requireBrowser = createRequire(new URL('../../avereo-app-saisie-unique/frontend/package.json', import.meta.url));
const { chromium } = requireBrowser('playwright');
const dist = new URL('../frontend/dist/', import.meta.url);
const reports = Array.from({length:65}, (_, i) => ({
  id:String(i + 1), title:'Visite technique', reference:'TEST-' + (i + 1),
  address:i === 64 ? 'Rue des Tilleuls' : 'Adresse fictive ' + (i + 1), updatedAt:'2026-11-09',
}));

test('recherche, limites et confirmation avant la liste sur ordinateur et mobile', async t => {
  const browser = await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH});
  t.after(() => browser.close());
  for (const width of [1180,390]) {
    const page = await browser.newPage({viewport:{width,height:800}});
    const loaded = [];
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.origin !== 'http://127.0.0.1') return route.abort();
      const ok = data => route.fulfill({json:{ok:true,...data}});
      if (url.pathname === '/api/auth.php') return ok({auth:{mode:'connect_gateway'},user:{name:'Test'}});
      if (url.pathname === '/api/reports.php') {
        const id = url.searchParams.get('id');
        if (id) {
          loaded.push(id);
          return ok({report:{id,payload:{reference_dossier:'TEST-' + id}}});
        }
        const query = (url.searchParams.get('q') || '').toLowerCase();
        return ok({reports:reports.filter(r => [r.title,r.address,r.reference].some(v => v.toLowerCase().includes(query)))
          .slice(0,Number(url.searchParams.get('limit')))});
      }
      const filename = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
      return route.fulfill({path:fileURLToPath(new URL(filename,dist))});
    });
    await page.addInitScript(() => localStorage.setItem('avereo-rapport-draft-v2',
      JSON.stringify({titre:'Brouillon fictif',reference_dossier:'TEST-LOCAL',updatedAt:'2026-11-09T08:00:00Z'})));
    await page.goto('http://127.0.0.1/');
    const panel = page.locator('.online-reports');
    const rows = panel.locator('.online-report-list li');
    await rows.nth(4).waitFor();
    assert.equal(await rows.count(),5);
    await panel.getByLabel('Afficher').selectOption('50');
    await rows.nth(49).waitFor();
    await rows.last().getByRole('button',{name:'Ouvrir'}).click();
    const confirmation = panel.getByRole('region',{name:'Confirmer la réouverture'});
    await confirmation.waitFor();
    assert.equal(await confirmation.evaluate(node => document.activeElement === node &&
      node.getBoundingClientRect().top < document.querySelector('.online-report-list').getBoundingClientRect().top &&
      node.getBoundingClientRect().top >= 0),true);
    const [backup] = await Promise.all([page.waitForEvent('download'),confirmation.getByText('Exporter le brouillon JSON').click()]);
    assert.equal(JSON.parse(await readFile(await backup.path(),'utf8')).reference_dossier,'TEST-LOCAL');
    await confirmation.getByText('Annuler').click();
    assert.deepEqual(loaded,[]);
    await panel.getByRole('searchbox').fill('inconnu');
    await panel.getByText('Aucun rapport ne correspond à cette recherche.').waitFor();
    await panel.getByRole('searchbox').fill('tilleuls');
    await rows.filter({hasText:'TEST-65'}).getByRole('button',{name:'Ouvrir'}).click();
    await confirmation.getByText('Ouvrir la copie en ligne').click();
    await page.getByRole('heading',{name:'Dossier',exact:true}).waitFor();
    assert.deepEqual(loaded,['65']);
    await page.close();
  }
});
