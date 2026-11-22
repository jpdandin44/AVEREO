import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import test from 'node:test';

const requireBrowser = createRequire(new URL('../../avereo-app-saisie-unique/frontend/package.json', import.meta.url));
const { chromium } = requireBrowser('playwright');
const dist = process.env.RAPPORT_TEST_DIST
  ? pathToFileURL(process.env.RAPPORT_TEST_DIST.replace(/\\/g, '/') + '/')
  : new URL('../frontend/dist/', import.meta.url);
const fixture = {
  titre: 'Aperçu fictif à conserver', reference_dossier: 'TEST-APERCU-FERMETURE',
  profil_metier: 'habitologue', categorie: 'Visite Globale',
  analyse: 'Texte fictif conservé après fermeture', recommandations: 'Conseils fictifs',
  observations: [], updatedAt: '2026-11-18T12:00:00Z',
};

test('aperçu refermable au-dessus du bandeau commun, au clic et au clavier sans modifier le dossier', async t => {
  const browser = await chromium.launch({executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH});
  t.after(() => browser.close());
  for (const audience of ['expert','client']) for (const viewport of [{width:1280,height:820}, {width:640,height:450}, {width:390,height:844}, {width:320,height:640}]) {
    await t.test(`${audience} · ${viewport.width} × ${viewport.height}`, async subtest => {
      const page = await browser.newPage({viewport});
      subtest.after(() => page.close());
      page.setDefaultTimeout(5000);
      const writes = [];
      page.on('request', request => { if (request.method() !== 'GET') writes.push(request.url()); });
      await page.route('**/*', async route => {
        const url = new URL(route.request().url());
        if (url.origin !== 'http://127.0.0.1') return route.abort();
        const ok = data => route.fulfill({json:{ok:true,...data}});
        if (url.pathname === '/api/auth.php') return ok({auth:{mode:'connect_gateway'}, user:{id:'37',provider:'avereo_connect',name:'Recette fictive'}});
        if (url.pathname === '/api/reports.php') return ok({reports:[]});
        const path = url.pathname === '/' ? 'index.html' : url.pathname.slice(1);
        return route.fulfill({path:fileURLToPath(new URL(path,dist))});
      });
      await page.addInitScript(value => localStorage.setItem('avereo-rapport-draft-v2', JSON.stringify(value)),
        {...fixture,livrable:{audience}});
      await page.goto('http://127.0.0.1/');
      await page.getByRole('button', {name:/Reprendre/}).click();
      await page.getByRole('button', {name:/Export/}).first().click();
      const opener = page.getByRole('button', {name:/^Aper[cç]u$/});
      // The real shared header uses manual popovers, above ordinary z-index overlays.
      await page.locator('avereo-account-menu .shell').evaluate(header => {
        if (!header.matches(':popover-open')) throw new Error('Bandeau commun absent de la couche supérieure');
      });
      const draftBefore = await page.evaluate(() => localStorage.getItem('avereo-rapport-draft-v2'));
      await opener.click();
      const close = page.getByRole('button', {name:/Fermer l.aper[cç]u/});
      await close.click({timeout:3000});
      assert.equal(await close.count(), 0);
      assert.equal(await opener.evaluate(node => document.activeElement === node), true);
      await opener.click();
      // Focus stays in the preview controls until the document is selected.
      await page.keyboard.press('Escape');
      await close.waitFor({state:'detached'});
      await opener.click();
      const frame = page.frameLocator('iframe[title="Apercu du rapport"]');
      await frame.getByRole('heading', {name:fixture.titre,exact:true}).waitFor();
      await frame.locator('body').click({position:{x:8,y:8}});
      // The sandboxed document has its own keyboard context. Shift+Tab returns
      // to the close button without relaxing its sandbox or injecting scripts.
      await page.keyboard.press('Shift+Tab');
      assert.equal(await close.evaluate(node => document.activeElement === node), true);
      await page.keyboard.press('Enter');
      await close.waitFor({state:'detached'});
      assert.equal(await page.evaluate(() => localStorage.getItem('avereo-rapport-draft-v2')), draftBefore);
      assert.deepEqual(writes, []);
    });
  }
});
