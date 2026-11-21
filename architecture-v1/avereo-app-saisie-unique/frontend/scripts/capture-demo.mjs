import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'../..');const out=resolve(root,'.local/livraison/captures');await mkdir(out,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.UNI_BROWSER_EXECUTABLE});
try {
 const ctx=await browser.newContext({viewport:{width:1440,height:1000},locale:'fr-FR'});const page=await ctx.newPage();const erreurs=[];page.on('pageerror',e=>erreurs.push(e.message));
 await page.goto(new URL('../dist/index.html',import.meta.url).href);
 await page.getByRole('button',{name:'Tableau de bord',exact:true}).click();
 await page.getByRole('button',{name:'Ajouter le dossier démo complet'}).click();
 await page.screenshot({path:resolve(out,'01-dossiers.png')});
 await page.getByRole('button',{name:'Tableau de bord',exact:true}).click();
 assert.equal(await page.locator('.uni-kpis .uni-kpi').first().locator('strong').innerText(),'2');
 await page.screenshot({path:resolve(out,'02-pilotage.png')});
 await page.getByRole('button',{name:'Programmes',exact:true}).click();await page.getByRole('button',{name:/Programme démonstration/}).click();assert.equal(await page.locator('.uni-dossier-card').count(),1);
 await page.screenshot({path:resolve(out,'03-programmes.png')});
 await page.locator('.uni-dossier-card').click();
 await page.screenshot({path:resolve(out,'04-fiche.png')});
 await page.getByRole('tab',{name:/^Travaux/}).click();await page.screenshot({path:resolve(out,'05-travaux.png')});
 await page.getByRole('tab',{name:/^Financement/}).click();await page.screenshot({path:resolve(out,'06-financement.png')});
 await page.getByRole('tab',{name:/^Synthèse du logement/}).click();
 await page.pdf({path:resolve(root,'.local/livraison/documents/UNI-DEMO-SYN.pdf'),format:'A4',printBackground:true});
 await page.getByRole('button',{name:'Figer au dépôt…'}).click();await page.getByRole('alertdialog').getByRole('button',{name:'Figer au dépôt',exact:true}).click();await page.getByRole('button',{name:'Ne rien changer'}).click();
 await page.screenshot({path:resolve(out,'07-factures.png')});
 await page.getByRole('button',{name:'Tableau de bord',exact:true}).click();await page.setViewportSize({width:390,height:844});
 assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));await page.screenshot({path:resolve(out,'08-mobile.png'),fullPage:true});
 assert.deepEqual(erreurs,[]);await writeFile(resolve(out,'controle.json'),JSON.stringify({pilotage:true,programmes:true,fiche:true,figer:true,mobile:true,erreurs},null,2));console.log('Parcours enrichi et captures : OK');
} finally {await browser.close();}
