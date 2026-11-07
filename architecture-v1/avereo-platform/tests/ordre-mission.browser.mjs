import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { buildMissionScript } from '../../../.github/scripts/build-mission-script.mjs';
import catalog from '../data/modeles-lettres-mission.json' with {type:'json'};

const requireBrowser = createRequire(new URL('../../avereo-app-saisie-unique/frontend/package.json', import.meta.url));
const { chromium } = requireBrowser('playwright');
const fixture = {
  referenceDossier:'DOSSIER-A', referenceLettre:'MISSION-A',
  client:'Client <A> & associé', adresseClient:'10 rue du Courrier',
  email:'client-a@example.invalid', telephone:'00 00 00 00 01', adresseBien:'20 rue du Chantier',
};

test('l’ordre téléchargé depuis le cadre reprend le client, les étapes de l’offre et uniquement les options cochées', async t => {
  const browser = await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH});
  t.after(()=>browser.close());
  const context = await browser.newContext({acceptDownloads:true, locale:'fr-FR'});
  const page = await context.newPage();
  const menu = await readFile(new URL('../shared/account-menu.js',import.meta.url),'utf8');
  const module = await buildMissionScript();
  const base = 'http://127.0.0.1';
  await page.route('**/*', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path==='/account-menu.js' || path==='/assets/missions.js') {
      return route.fulfill({contentType:'text/javascript',body:path==='/account-menu.js'?menu:module});
    }
    if (path==='/') return route.fulfill({contentType:'text/html',body:'<iframe title="Application" src="/editeur"></iframe>'});
    if (path==='/editeur') return route.fulfill({contentType:'text/html',body:'<!doctype html><meta charset="utf-8"><script defer src="/account-menu.js"></script><avereo-account-menu placement="sidebar"></avereo-account-menu>'});
    return route.abort();
  });
  await page.goto(base+'/');
  const editor = page.frameLocator('iframe');
  const menuButton = editor.getByRole('button',{name:'Mon espace : ouvrir le menu du compte'});
  await menuButton.waitFor();
  const frame = page.frames().find(f=>f.url()===base+'/editeur');
  await frame.evaluate(initial => {
    window.fictitiousMission = initial;
    document.addEventListener('avereo-mission-context',event=>event.detail.provide({fields:window.fictitiousMission}));
  },fixture);
  await page.addScriptTag({path:fileURLToPath(new URL('../shared/vendor/jszip/jszip.min.js',import.meta.url))});
  const dialog = editor.getByRole('dialog',{name:'Préparer une mission'});
  async function open() {
    await menuButton.click();
    await editor.getByRole('button',{name:'Missions',exact:true}).click();
    await dialog.waitFor();
  }
  async function downloadOrder(reference) {
    const [download] = await Promise.all([page.waitForEvent('download'),dialog.getByRole('button',{name:'Générer l’ordre Word'}).click()]);
    assert.equal(await download.failure(),null);
    assert.equal(download.suggestedFilename(),'ordre-'+reference+'.docx');
    assert.equal(context.pages().length,1);
    assert.equal(page.url(),base+'/');
    const file = await readFile(await download.path());
    return page.evaluate(async encoded => {
      const zip = await window.JSZip.loadAsync(encoded,{base64:true});
      const xml = new DOMParser().parseFromString(await zip.file('word/document.xml').async('string'),'application/xml');
      if (xml.querySelector('parsererror')) throw Error('XML de l’ordre illisible');
      return Array.from(xml.getElementsByTagNameNS('*','p'),p=>p.textContent);
    },file.toString('base64'));
  }

  await open();
  for (const offer of catalog.offres) {
    await dialog.getByLabel('Offre AVEREO').selectOption(offer.id);
    const plan = dialog.locator('.order-plan');
    if (await plan.getAttribute('open')===null) await plan.locator('summary').click();
    assert.deepEqual(await plan.locator('ol strong').allTextContents(),offer.ordre.etapes.map(step=>step.titre));
    assert.equal(await plan.locator('input:checked').count(),0);
    const paragraphs = await downloadOrder(fixture.referenceLettre);
    for (const value of Object.values(fixture)) assert.ok(paragraphs.includes(value),value);
    assert.ok(paragraphs.includes(offer.ordre.objet));
    assert.ok(paragraphs.includes(offer.ordre.livrable));
    assert.ok(paragraphs.includes('Étapes de la prestation'));
    for (const [i,step] of offer.ordre.etapes.entries()) {
      assert.ok(paragraphs.includes((i+1)+'. '+step.titre));
      assert.ok(paragraphs.includes(step.consigne));
      assert.ok(paragraphs.includes('À consigner : '+step.trace));
    }
    assert.ok(!paragraphs.includes('Options retenues pour cet ordre'));
    const option = catalog.optionsOrdre[offer.ordre.options[0]];
    await plan.getByRole('checkbox',{name:option.titre,exact:true}).check();
    const withOption = await downloadOrder(fixture.referenceLettre);
    assert.ok(withOption.includes(option.titre) && withOption.includes(option.consigne));
    for (const other of offer.ordre.options.slice(1)) assert.ok(!withOption.includes(catalog.optionsOrdre[other].titre));
  }
  await dialog.getByRole('button',{name:'Fermer',exact:true}).click();
  const next = {referenceLettre:'MISSION-B',client:'Client B',adresseBien:'Site B',offre:'energie-travaux',
    objet:'Arbitrage propre au dossier B',livrable:'Restitution propre au dossier B'};
  await frame.evaluate(fields=>{window.fictitiousMission=fields;},next);
  await open();
  const second = await downloadOrder(next.referenceLettre);
  assert.ok(second.includes(next.objet) && second.includes(next.livrable) && second.includes('À renseigner'));
  assert.ok(!second.some(s=>s.includes(fixture.client)||s.includes(fixture.adresseClient)||s.includes(fixture.email)));
  assert.ok(!second.includes('Options retenues pour cet ordre'));

  const client = dialog.getByLabel('Nom ou raison sociale du client');
  await client.fill('');
  await dialog.getByRole('button',{name:'Générer l’ordre Word'}).click();
  assert.ok(await client.evaluate(el=>el.validity.valueMissing && el===el.getRootNode().activeElement));
  await client.fill(next.client);
  await dialog.getByLabel('Objet de la mission').fill('');
  await dialog.getByRole('button',{name:'Générer la lettre Word'}).click();
  assert.equal(await dialog.getByLabel('Objet de la mission').evaluate(el=>el===el.getRootNode().activeElement),true);
  await dialog.getByLabel('Objet de la mission').fill('Question personnalisée');
  await dialog.getByRole('button',{name:'Générer la lettre Word'}).click();
  assert.match(await dialog.getByRole('status').textContent(),/modèle Word préparé/);
  assert.notEqual(await dialog.locator('.letter-models').getAttribute('open'),null);
});
