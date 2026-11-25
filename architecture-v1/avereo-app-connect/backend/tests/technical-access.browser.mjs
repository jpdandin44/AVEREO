import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const require=createRequire(process.env.AVEREO_PLAYWRIGHT_PACKAGE ? pathToFileURL(process.env.AVEREO_PLAYWRIGHT_PACKAGE)
  : new URL('../../../avereo-app-saisie-unique/frontend/package.json',import.meta.url));
const {chromium}=require('playwright');
const origin=process.env.CONNECT_RECIPE_ORIGIN || 'http://127.0.0.1:5245';
assert.equal(new URL(origin).hostname,'127.0.0.1');
const output=resolve(process.env.CONNECT_RECIPE_OUTPUT || '.local/technical-access');await mkdir(output,{recursive:true});
const target=Number(process.env.CONNECT_RECIPE_ACCOUNT || '2');assert.ok([2,101,102].includes(target));
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:1280,height:950}});page.setDefaultTimeout(15000);
const errors=[];page.on('pageerror',error=>errors.push(error.message));
let linkedReport=null, beforeDefinition=null;
const listing=()=>page.evaluate(async()=> (await (await fetch('/api/v1/admin/profiles')).json()).data);
async function reportSession() {
  const reportOrigin=process.env.RAPPORT_RECIPE_ORIGIN;assert.equal(new URL(reportOrigin).hostname,'127.0.0.1');
  const context=await browser.newContext();if(target===2)await context.addCookies([{name:'profiles_fixture_actor',value:'2',url:reportOrigin}]);
  const report=await context.newPage();report.setDefaultTimeout(15000);await report.goto(reportOrigin+'/fixture/');
  await report.getByRole('link',{name:target===2?'Compte au profil administré':target===101?'Compte fictif A':'Compte fictif B',exact:true}).click();
  await report.getByRole('heading',{name:'Créer ou reprendre un rapport',exact:true}).waitFor();return report;
}
try {
  await page.goto(origin);
  await page.locator('avereo-account-menu').getByRole('button',{name:/Mon compte/}).click();
  await page.getByRole('button',{name:'Gérer les comptes',exact:true}).click();
  const card=()=>page.locator(`[data-account-id="${target}"]`);
  await card().locator('[data-technical-access]').waitFor();
  if (process.env.RAPPORT_RECIPE_ORIGIN) {
    // Prepare only this disposable member's ordinary create/update rights through the native editor.
    const data=await listing(), id=data.assignments[String(target)];
    if(id){
      await page.locator('#profiles-management > details > summary').click();
      const editor=page.locator('#profile-template-'+id).locator('xpath=ancestor::details[1]');
      await editor.locator(':scope > summary').click();
      await editor.getByRole('checkbox',{name:'Créer un dossier',exact:true}).check();
      await editor.getByRole('checkbox',{name:'Modifier les dossiers',exact:true}).check();
      await editor.getByRole('button',{name:'Enregistrer ce profil',exact:true}).click();
      await page.getByRole('dialog',{name:'Confirmer l’action',exact:true}).getByRole('button',{name:'Confirmer',exact:true}).click();
    }
    await card().locator('[data-technical-access]').waitFor();
    const baseline=await listing();beforeDefinition={profiles:baseline.profiles,assignments:baseline.assignments};
    assert.deepEqual(await page.locator('#profile-template-new option').evaluateAll(options=>options.map(option=>option.value)),['habitologue','architecte','maitre_oeuvre']);
  }
  await card().locator('[data-technical-access] summary').click();
  const right=()=>card().getByRole('checkbox',{name:'Créer un Rapport Technique',exact:true});
  assert.equal(await right().isChecked(),false);
  await right().check();await card().getByRole('button',{name:'Enregistrer le droit Rapport Technique',exact:true}).click();
  await page.getByRole('dialog',{name:'Confirmer l’action',exact:true}).getByRole('button',{name:'Annuler',exact:true}).click();
  const unchanged=await page.evaluate(async()=> (await (await fetch('/api/v1/admin/profiles')).json()).data);
  assert.equal(unchanged.technicalReportCreation[String(target)]??false,false);
  await card().getByRole('button',{name:'Enregistrer le droit Rapport Technique',exact:true}).click();
  await page.getByRole('dialog',{name:'Confirmer l’action',exact:true}).getByRole('button',{name:'Confirmer',exact:true}).click();
  await card().locator('[data-technical-access] summary').filter({hasText:'Création d’un Rapport Technique : autorisée'}).waitFor();
  await page.reload();
  await page.locator('avereo-account-menu').getByRole('button',{name:/Mon compte/}).click();
  await page.getByRole('button',{name:'Gérer les comptes',exact:true}).click();
  await card().locator('[data-technical-access] summary').click();assert.equal(await right().isChecked(),true);
  await card().screenshot({path:resolve(output,'gestion-droit-technique.png')});
  if (process.env.RAPPORT_RECIPE_ORIGIN) {
    linkedReport=await reportSession();
    const identity=await (await linkedReport.request.get(new URL('/api/auth.php?action=me',process.env.RAPPORT_RECIPE_ORIGIN).href)).json();
    assert.equal(identity.user.id,String(target));assert.equal(identity.user.reportCapabilities.technicalReport,true);
    await linkedReport.getByRole('button',{name:'Nouveau rapport',exact:true}).click();
    await linkedReport.getByRole('dialog',{name:'Choisir le type de rapport',exact:true}).getByRole('button',{name:/^Rapport Technique/}).click();
    await linkedReport.getByLabel('Référence du dossier',{exact:true}).fill('DROIT-TECHNIQUE-FICTIF-'+Date.now());
    await linkedReport.getByRole('navigation',{name:'Navigation du rapport',exact:true}).getByRole('button',{name:/Constats/}).click();
    await linkedReport.getByLabel('Constat',{exact:true}).fill('Constat fictif conservé après retrait du droit de création.');
    await linkedReport.getByRole('button',{name:/Sauver en ligne/}).click();
    await linkedReport.getByText(/sauvegardés en ligne et relus sur le serveur/).waitFor();
    const reports=await (await linkedReport.request.get(new URL('/api/reports.php?limit=50',process.env.RAPPORT_RECIPE_ORIGIN).href)).json();
    linkedReport.testReportId=reports.reports.find(report=>report.reference.startsWith('DROIT-TECHNIQUE-FICTIF-')).id;
  }
  await right().uncheck();await card().getByRole('button',{name:'Enregistrer le droit Rapport Technique',exact:true}).click();
  await page.getByRole('dialog',{name:'Confirmer l’action',exact:true}).getByRole('button',{name:'Confirmer',exact:true}).click();
  await card().locator('[data-technical-access] summary').filter({hasText:'Création d’un Rapport Technique : non autorisée'}).waitFor();
  if (linkedReport) {
    const reportOrigin=process.env.RAPPORT_RECIPE_ORIGIN, id=linkedReport.testReportId;
    const me=await (await linkedReport.request.get(new URL('/api/auth.php?action=me',reportOrigin).href)).json();
    assert.equal(me.user.reportCapabilities.technicalReport,false);
    const opened=await linkedReport.request.get(new URL('/api/reports.php?id='+id,reportOrigin).href);assert.equal(opened.status(),200);
    const payload=(await opened.json()).report.payload;payload.analyse_expert='Analyse fictive actualisée après retrait de la seule création.';
    assert.equal((await linkedReport.request.post(new URL('/api/reports.php',reportOrigin).href,{data:{id,report:payload},headers:{Origin:reportOrigin}})).status(),200);
    assert.equal((await linkedReport.request.get(new URL('/api/reports.php?id='+id+'&download=1',reportOrigin).href)).status(),200);
    const copy=await linkedReport.request.post(new URL('/api/reports.php',reportOrigin).href,{data:{report:payload},headers:{Origin:reportOrigin}});
    assert.equal(copy.status(),403);assert.equal((await copy.json()).error,'technical_report_refused');
    const after=await listing();assert.deepEqual({profiles:after.profiles,assignments:after.assignments},beforeDefinition);
    await linkedReport.reload();await linkedReport.getByRole('button',{name:'Reprendre',exact:true}).click();
    await linkedReport.getByRole('heading',{name:'Mission',exact:true}).waitFor();
  }
  if(process.env.CONNECT_RECIPE_KEEP_GRANTED==='true'){
    await card().locator('[data-technical-access] summary').click();await right().check();
    await card().getByRole('button',{name:'Enregistrer le droit Rapport Technique',exact:true}).click();
    await page.getByRole('dialog',{name:'Confirmer l’action',exact:true}).getByRole('button',{name:'Confirmer',exact:true}).click();
    await card().locator('[data-technical-access] summary').filter({hasText:'Création d’un Rapport Technique : autorisée'}).waitFor();
  }
  assert.deepEqual(errors,[]);
  await writeFile(resolve(output,'browser.json'),JSON.stringify({status:'passed',observedAt:new Date().toISOString(),fictitiousAccount:target,checks:['Case du droit par compte visible','Annulation sans attribution','Confirmation et enregistrement natifs','Rechargement conserve le droit','Révocation native','Aucune erreur JavaScript'],pairedReportTested:Boolean(linkedReport),pairedChecks:linkedReport?['Capacité Rapport issue du droit enregistré dans CONNECT','Création et sauvegarde du dossier technique','Retrait du droit observé immédiatement par Rapport','Ancien dossier toujours ouvert, modifiable et exportable','Nouvelle copie technique refusée après retrait','Trois parcours de référence et définitions des profils conservés']:[],preparedFictitiousGrant:process.env.CONNECT_RECIPE_KEEP_GRANTED==='true',scope:'CONNECT/Rapport locaux et comptes fictifs uniquement'},null,2)+'\n');
  console.log(JSON.stringify({status:'passed',output}));
} finally {await browser.close();}
