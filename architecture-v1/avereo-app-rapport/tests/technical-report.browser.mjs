import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
const browserRequire=createRequire(process.env.RAPPORT_PLAYWRIGHT_PACKAGE ? pathToFileURL(process.env.RAPPORT_PLAYWRIGHT_PACKAGE) : new URL('../../avereo-app-saisie-unique/frontend/package.json',import.meta.url));
const {chromium}=browserRequire('playwright');
const require=createRequire(new URL('../frontend/package.json',import.meta.url));
const JSZip=require('jszip');
const origin=process.env.RAPPORT_RECIPE_ORIGIN || 'http://127.0.0.1:5240';
assert.equal(new URL(origin).hostname,'127.0.0.1');
const output=resolve(process.env.RAPPORT_RECIPE_OUTPUT || '.local/technical-recipe');await mkdir(output,{recursive:true});
const fixture=JSON.parse(await readFile(new URL('./fixtures/dossier-complet.json',import.meta.url),'utf8'));
const png=Buffer.from(fixture.signature.split(',')[1],'base64');
const browser=await chromium.launch({channel:process.env.PLAYWRIGHT_CHANNEL || 'chrome',headless:true});
const checks=[],errors=[];
const ref='RT-RECETTE-'+Date.now();
const context=await browser.newContext({viewport:{width:1280,height:900},acceptDownloads:true});
async function enter(context,account='A'){
  const page=await context.newPage();page.setDefaultTimeout(15000);page.on('pageerror',error=>errors.push(error.message));
  await page.route('**/*',route=>new URL(route.request().url()).origin===origin ? route.continue() : route.abort());
  await page.goto(origin+'/fixture/');await page.getByRole('link',{name:'Compte fictif '+account,exact:true}).click();
  await page.getByRole('heading',{name:'Créer ou reprendre un rapport'}).waitFor();return page;
}
async function step(page,name){await page.getByRole('navigation',{name:'Navigation du rapport',exact:true}).getByRole('button',{name:new RegExp(name)}).click();}
async function draft(page){await page.waitForTimeout(850);return page.evaluate(async()=>{
  const fallback=JSON.parse(localStorage.getItem('avereo-rapport-draft-v2'));if(fallback)return fallback;
  return new Promise((resolve,reject)=>{const request=indexedDB.open('keyval-store');request.onerror=()=>reject(request.error);
    request.onsuccess=()=>{const db=request.result;if(!db.objectStoreNames.contains('keyval')){db.close();resolve(null);return;}
      const read=db.transaction('keyval','readonly').objectStore('keyval').get('avereo-rapport-draft-v2');read.onsuccess=()=>{resolve(read.result||null);db.close();};read.onerror=()=>{reject(read.error);db.close();};};});
});}
async function downloadWord(page,audience){
  const pending=page.waitForEvent('download');await page.getByRole('button',{name:'Générer Word (.docx)',exact:true}).click();
  const download=await pending;const file=resolve(output,'technical-'+audience+'.docx');await download.saveAs(file);
  const zip=await JSZip.loadAsync(await readFile(file));return {file,xml:await zip.file('word/document.xml').async('string'),images:Object.keys(zip.files).filter(name=>name.startsWith('word/media/')&&!zip.files[name].dir).length};
}
try{
  const page=await enter(context);
  await page.getByRole('button',{name:'Nouveau Rapport Technique',exact:true}).click();
  await page.getByRole('heading',{name:'Mission',exact:true}).waitFor();
  assert.equal(await page.getByRole('navigation',{name:'Navigation du rapport',exact:true}).getByRole('button').count(),4);
  await page.getByLabel('Référence du dossier',{exact:true}).fill(ref);
  await page.getByLabel('Nom du propriétaire',{exact:true}).fill('Propriétaire fictif');
  await page.getByLabel('Adresse du logement',{exact:true}).fill('10 rue Exemple fictif');
  await page.getByLabel('Intervenant',{exact:true}).fill('Expert fictif');
  await page.getByLabel('Objet de la mission',{exact:true}).fill('Examen fictif façade et humidité');
  await page.getByLabel('Périmètre de la visite',{exact:true}).fill('Parties accessibles, visite visuelle');
  await page.getByLabel('Limites et parties non accessibles',{exact:true}).fill('Aucun sondage destructif');
  checks.push('Mission courte sans écoute client ni projections');
  await step(page,'Constats');
  const card=()=>page.locator('.technical-workspace .observation-card');
  async function finding(title,text){await card().getByLabel('Titre',{exact:true}).fill(title);await card().getByLabel('Piece / zone',{exact:true}).fill('Façade sud');await card().getByLabel('Constat',{exact:true}).fill(text);await card().getByLabel('Conseils de l’expert',{exact:true}).fill('Conseil '+title);}
  await finding('Fissure fictive','Constat fictif façade');
  await card().getByRole('button',{name:/Détails techniques/}).click();
  await card().getByLabel('Explications et hypothèses',{exact:true}).fill('Hypothèse à vérifier https://example.org/');
  await card().getByLabel('Mesures, unités et conditions',{exact:true}).fill('MESURE-INTERNE-12');
  await card().locator('.photo-grid input[type=file]').setInputFiles({name:'photo-fictive.png',mimeType:'image/png',buffer:png});
  await card().locator('.photo-thumb img').waitFor();
  await page.getByRole('button',{name:'Ajouter un constat',exact:true}).click();await finding('Humidité fictive','Constat fictif humidité');
  await page.getByRole('button',{name:'Ajouter un constat',exact:true}).click();await finding('EXCLU-CLIENT','Constat privé non sélectionné');
  assert.equal(await card().count(),1);checks.push('Trois constats, un seul ouvert ; photo et détail technique conservés');
  await card().getByRole('button',{name:/Monter l’observation/}).focus();await page.keyboard.press('Enter');
  await page.getByRole('navigation',{name:'Choisir un constat',exact:true}).getByRole('button',{name:/Fissure fictive/}).click();
  await card().getByRole('button',{name:'Localiser sur un plan',exact:true}).click();
  await page.getByText('Importer des plans',{exact:true}).click();
  await page.getByLabel('Choisir une ou plusieurs images',{exact:true}).setInputFiles({name:'niveau-fictif.png',mimeType:'image/png',buffer:png});
  await page.getByRole('button',{name:'Placer le repère',exact:true}).click();
  await page.getByLabel(/Zone de placement/).focus();await page.keyboard.press('Enter');
  await page.getByRole('button',{name:/Repère 1 — Fissure fictive/}).waitFor();
  checks.push('Ordre au clavier et import de plan avec repère natif');
  await page.getByRole('button',{name:/Plans et vues du dossier/}).first().click();
  await card().getByRole('button',{name:/Détails techniques/}).click();
  await page.screenshot({path:resolve(output,'technical-desktop.png'),fullPage:true});
  for(const width of [736,390,320]){
    await page.setViewportSize({width,height:900});
    const sizes=await page.evaluate(()=>({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
    assert.ok(sizes.scroll<=sizes.client+1,'No horizontal overflow at '+width);
    for(const button of await page.getByRole('navigation',{name:'Navigation du rapport',exact:true}).getByRole('button').all()){
      const bounds=await button.boundingBox();assert.ok(bounds.x>=0 && bounds.x+bounds.width<=width,'All technical steps visible at '+width);
    }
    if(width===320)await page.screenshot({path:resolve(output,'technical-mobile.png'),fullPage:true});
  }
  await page.setViewportSize({width:1280,height:900});
  await step(page,'Rapport');
  await page.getByLabel("Analyse de l'expert",{exact:true}).fill('Synthèse fictive expert');
  await page.getByLabel('Recommandations',{exact:true}).fill('Vérification complémentaire fictive');
  await page.getByRole('button',{name:/Contrôle final et signature/}).click();
  await page.getByLabel('Nom du signataire',{exact:true}).fill('Expert fictif');
  const canvas=page.locator('.signature-block canvas');const box=await canvas.boundingBox();
  await page.mouse.move(box.x+20,box.y+30);await page.mouse.down();await page.mouse.move(box.x+140,box.y+60,{steps:7});await page.mouse.up();
  await page.getByRole('button',{name:'Apercu',exact:true}).click();await page.getByRole('button',{name:'Fermer l’aperçu',exact:true}).click();
  await page.getByRole('button',{name:'Apercu',exact:true}).click();await page.keyboard.press('Escape');
  assert.equal(await page.getByRole('dialog',{name:'Aperçu du rapport',exact:true}).count(),0);checks.push('Aperçu refermable au bouton et par Échap');
  const expert=await downloadWord(page,'expert');assert.match(expert.xml,/MESURE-INTERNE-12/);assert.match(expert.xml,/Examen fictif façade/);assert.ok(expert.images>=2);
  await page.getByRole('button',{name:/Options du livrable/}).click();await page.getByLabel(/Destinataire du document/).selectOption('client');
  await page.getByLabel('L’essentiel pour le client',{exact:true}).fill('Synthèse client fictive');
  await page.getByRole('checkbox',{name:/Fissure fictive/}).check();
  const client=await downloadWord(page,'client');assert.match(client.xml,/Fissure fictive/);assert.doesNotMatch(client.xml,/EXCLU-CLIENT|Constat privé|MESURE-INTERNE-12/);assert.ok(client.images>=1);
  checks.push('Word expert/client générés par le parcours réel ; médias, mission et confidentialité contrôlés dans les fichiers');
  const expected=await draft(page);
  await page.getByRole('button',{name:/Sauver en ligne/}).click();
  await page.getByText(/sauvegardés en ligne et relus sur le serveur/).waitFor();
  const saved=await draft(page);assert.ok(saved.onlineReportId);checks.push('Sauvegarde et relecture serveur natives');
  const freshContext=await browser.newContext({viewport:{width:1280,height:900}});const fresh=await enter(freshContext);
  assert.equal(await fresh.evaluate(()=>localStorage.getItem('avereo-rapport-draft-v2')),null);
  assert.equal(await draft(fresh),null);
  await fresh.locator('li').filter({hasText:ref}).getByRole('button',{name:'Ouvrir le dossier',exact:true}).click();
  await fresh.getByRole('heading',{name:'Mission',exact:true}).waitFor();
  const reopened=await draft(fresh);const clean=value=>{const result=structuredClone(value);delete result.updatedAt;return result;};
  assert.deepEqual(clean(reopened),clean(saved));assert.deepEqual(reopened.observations,expected.observations);
  await step(fresh,'Constats');assert.equal(await fresh.locator('.technical-workspace .observation-card').count(),1);
  checks.push('Nouvelle session CONNECT fictive sans brouillon : réouverture serveur exacte, photos/plan/repère/signature inclus');
  const deniedContext=await browser.newContext();const denied=await enter(deniedContext,'B');
  assert.equal(await denied.getByRole('button',{name:'Nouveau Rapport Technique',exact:true}).count(),0);checks.push('Compte B non habilité : création technique masquée');
  await denied.getByRole('button',{name:'Nouveau rapport',exact:true}).click();
  await denied.getByRole('heading',{name:'Dossier',exact:true}).waitFor();
  assert.equal(await denied.getByRole('navigation',{name:'Navigation du rapport',exact:true}).getByRole('button').count(),6);
  const globalDraft=await draft(denied);assert.equal(globalDraft.categorie,'Visite Globale');assert.equal(globalDraft.mission_technique,undefined);
  checks.push('Analyse globale conserve ses cinq étapes et son dossier sans conversion technique');
  assert.deepEqual(errors,[]);
  await writeFile(resolve(output,'technical-browser-receipt.json'),JSON.stringify({status:'passed',observedAt:new Date().toISOString(),reference:ref,checks,errors,expertWord:expert.file,clientWord:client.file,wordRendering:'Contenu et médias DOCX contrôlés ; relecture native Microsoft Word non réalisée.',serverReopenExact:true,scope:'Local fictif uniquement ; aucune préproduction modifiée.'},null,2)+'\n');
  console.log(JSON.stringify({status:'passed',checks:checks.length,reference:ref,output}));
}finally{await browser.close();}
