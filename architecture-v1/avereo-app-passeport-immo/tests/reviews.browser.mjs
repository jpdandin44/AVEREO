import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
const require = createRequire(process.env.PASSEPORT_REVIEW_BROWSER_PACKAGE);
const { chromium } = require('playwright');
const seed = JSON.parse(await readFile(process.argv[2], 'utf8'));
assert.equal(new URL(seed.origin).hostname, '127.0.0.1');
const output = resolve(process.env.PASSEPORT_REVIEW_OUTPUT || '.local/review-browser');
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ channel: 'chrome', headless: true });
const errors = [], checks = [];
async function context(cookie) {
  const result = await browser.newContext({ viewport: { width: 1280, height: 900 }, acceptDownloads: true });
  const split = cookie.indexOf('=');
  await result.addCookies([{ name: cookie.slice(0, split), value: cookie.slice(split + 1), url: seed.origin }]);
  const page = await result.newPage(); page.setDefaultTimeout(15000); page.on('pageerror', e => errors.push(e.message));
  // All browser traffic stays within the isolated native localhost fixture.
  await page.route('**/*', route => {
    const request = route.request(), url = new URL(request.url());
    if (url.origin !== seed.origin) return route.abort();
    return route.continue();
  });
  await page.goto(seed.origin); await page.getByRole('heading', { name: 'Mes Biens', exact: true }).waitFor();
  return page;
}
async function property(page) {
  await page.goto(seed.origin); await page.getByText('Bien fictif relecture', { exact: true }).click();
  await page.getByRole('button', { name: 'Rapports privés', exact: true }).click();
  return page.getByRole('region', { name: 'Relecture experte du bien', exact: true });
}
async function submit(page, path) {
  const region = await property(page);
  await region.getByText('Soumettre une version à relecture', { exact: true }).click();
  await region.getByLabel('Fichier de demande de revue', { exact: true }).setInputFiles(path);
  await region.getByLabel('Compte CONNECT du relecteur', { exact: true }).fill('fixture-43');
  await region.getByRole('button', { name: 'Vérifier le relecteur', exact: true }).click();
  await region.getByText('Relecteur : Compte fictif 43', { exact: true }).waitFor();
  const response = page.waitForResponse(r => r.url().endsWith('/report-reviews') && r.request().method() === 'POST');
  await region.getByRole('button', { name: 'Confirmer la demande privée de relecture', exact: true }).click();
  const result = await response; assert.equal(result.status(), 201); return (await result.json()).review;
}
function card(page, status) {
  return page.locator('article').filter({ has: page.getByRole('heading', { name: `${seed.reference} · ${status}`, exact: true }) });
}
async function confirm(page, title) {
  const dialog = page.getByRole('dialog', { name: title, exact: true });
  await dialog.getByRole('checkbox').check();
  await dialog.getByRole('button', { name: 'Confirmer', exact: true }).click(); await dialog.waitFor({ state: 'hidden' });
}
try {
  const owner = await context(seed.ownerCookie), reviewer = await context(seed.reviewerCookie);
  await submit(owner, seed.initial); checks.push('Nomination privée confirmée depuis le bien');
  await reviewer.reload(); const pending = card(reviewer, 'Word à relire'); await pending.waitFor();
  assert.equal(await pending.getByRole('button', { name: 'Valider les Word', exact: true }).isDisabled(), true);
  await pending.getByRole('button', { name: 'Demander des corrections', exact: true }).click();
  const corrections = reviewer.getByRole('dialog', { name: 'Demander des corrections ?', exact: true });
  await corrections.getByRole('textbox').fill('Constat o1, page 1 : préciser la mesure.');
  await confirm(reviewer, 'Demander des corrections ?'); checks.push('Refus motivé depuis le compte relecteur');
  const latest = await submit(owner, seed.corrected);
  await reviewer.reload(); const current = card(reviewer, 'Word à relire'); await current.waitFor();
  for (const kind of ['expert', 'client']) {
    const pendingDownload=reviewer.waitForEvent('download');
    await current.getByRole('button', { name: `Télécharger le Word ${kind} pour relecture`, exact: true }).click();
    const download=await pendingDownload; const path=resolve(output,`word-${kind}.docx`);await download.saveAs(path);
    const bytes=await readFile(path);
    assert.equal(createHash('sha256').update(bytes).digest('hex'),latest.files[`rapport-${kind}.docx`].sha256);
  }
  checks.push('Deux Word privés téléchargés avec empreintes exactes, sans PDF préalable');
  await current.getByRole('button', { name: 'Valider les Word', exact: true }).click(); await confirm(reviewer, 'Valider les documents Word ?');
  checks.push('Validation explicite sur les documents Word');
  await property(owner); const approved = card(owner, 'Word validés'); await approved.waitFor();
  assert.equal(await approved.getByRole('button',{name:'Publier le PDF client',exact:true}).count(),0);
  await approved.getByRole('button',{name:'Préparer le PDF après validation Word',exact:true}).click();
  const preparation=owner.getByRole('dialog',{name:'Préparer le PDF après validation Word ?',exact:true});
  await preparation.getByLabel('PDF client issu du Word validé',{exact:true}).setInputFiles(seed.finalPdf);
  await confirm(owner,'Préparer le PDF après validation Word ?');
  const ready=card(owner,'PDF prêt à publier');await ready.waitFor();checks.push('PDF préparé seulement après validation des Word et confirmation de mise en page');
  await ready.getByRole('button',{name:'Contrôler le PDF final',exact:true}).click();
  const reader=owner.getByRole('dialog',{name:`Contrôle du PDF final — ${seed.reference}`,exact:true});
  await reader.getByText('Page 1 sur 1',{exact:true}).waitFor();await reader.locator('canvas').waitFor({state:'visible'});
  await owner.screenshot({path:resolve(output,'pdf-final-desktop.png'),fullPage:false});
  await reader.getByRole('button',{name:'Fermer',exact:true}).click();checks.push('Rendu du PDF final contrôlé après validation Word');
  await ready.getByRole('button', { name: 'Publier le PDF client', exact: true }).click();
  const publication = owner.getByRole('dialog', { name: 'Publier le PDF client ?', exact: true });
  await publication.getByText(/Compte fictif 44/).waitFor(); await confirm(owner, 'Publier le PDF client ?');
  await card(owner, 'Publié').waitFor(); checks.push('Publication propriétaire séparée avec rappel du destinataire client');
  await owner.setViewportSize({ width: 390, height: 844 });
  assert.equal(await owner.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true);
  await owner.screenshot({ path: resolve(output, 'revues-mobile.png'), fullPage: true }); checks.push('Interface à 390 px sans débordement horizontal');
  const published = (await (await owner.request.get(seed.origin + '/api/biens/review-fixture/report-reviews')).json()).reviews.find(r => r.id === latest.id);
  assert.equal(published.status, 'published'); assert.ok(published.documentId);
  const fresh = await context(seed.ownerCookie); await card(fresh, 'Publié').waitFor(); checks.push('Version publiée retrouvée dans une nouvelle session navigateur');
  assert.deepEqual(errors, []);
  await writeFile(resolve(output, 'browser-receipt.json'), JSON.stringify({ checks, pageErrors: errors, origin: seed.origin, data: 'fictitious', hostedSsoQualified: false, wordReadingInMicrosoftWordQualified: false }, null, 2));
  console.log(JSON.stringify({ browserChecks: checks.length, pageErrors: errors.length }));
} catch (error) {
  for (const [i, context] of browser.contexts().entries()) for (const page of context.pages()) {
    await page.screenshot({ path: resolve(output, `failure-${i}.png`), fullPage: true }).catch(() => {});
    await writeFile(resolve(output, `failure-${i}.txt`), JSON.stringify({ error: error.message, pageErrors: errors, text: await page.locator('body').innerText() }, null, 2));
  }
  throw error;
} finally { await browser.close(); }
