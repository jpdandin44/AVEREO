import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {execFileSync} from 'node:child_process';
import {createDevelopmentStore} from '../workflows/development-store.mjs';
import {projectDevelopmentVersions,inspectDevelopmentGit} from '../workflows/development-versions.mjs';
async function fixture(t){const root=await mkdtemp(join(tmpdir(),'development-portfolio-'));t.after(async()=>{assert.ok(resolve(root).startsWith(resolve(tmpdir())+sep));await rm(root,{recursive:true,force:true});});return root;}
test('un chantier commun apparaît dans plusieurs applications sans copier son journal',async t=>{
  const root=await fixture(t),file=join(root,'suivi.json'),raw={iterationId:'shared',stage:'development',candidate:{sourceSha:'a'.repeat(40)},requirements:[{id:'r',text:'Résultat attendu'}]};
  await writeFile(file,JSON.stringify(raw));const before=await readFile(file);
  const store=await createDevelopmentStore([{id:'shared',root,file:'suivi.json',applicationIds:['rapport','drone'],writable:false}],{adminId:'101',applications:[{id:'rapport',name:'Rapport'},{id:'drone',name:'Drone'},{id:'coupe',name:'Coupe'}]});
  const apps=await store.portfolio();assert.equal(apps.length,3);assert.equal(apps[0].iterations[0].id,apps[1].iterations[0].id);assert.equal(apps[2].missingTracking,true);assert.equal((await store.get('shared')).unassignedCriteria.length,1);assert.deepEqual(await readFile(file),before);
});
test('une source manquante est signalée sans arrêter les autres applications',async t=>{
  const root=await fixture(t);await writeFile(join(root,'ok.json'),JSON.stringify({iterationId:'ok',stage:'local'}));const store=await createDevelopmentStore([{id:'ok',root,file:'ok.json'},{id:'missing',root,file:'absent.json'}]);const list=await store.list();assert.equal(list[0].currentPhase,1);assert.equal(list[1].unavailable,true);assert.equal((await store.portfolio())[1].missingTracking,true);
});
test('la phase déclarée reste visible avec phases structurées et sans currentPhase',async t=>{
  const root=await fixture(t);await writeFile(join(root,'state.json'),JSON.stringify({stage:'developpement-local',phases:[0,1,2,3].map(id=>({id,status:'not_started'}))}));const store=await createDevelopmentStore([{id:'state',root,file:'state.json'}]);assert.equal((await store.get('state')).currentPhase,1);
});
test('un candidat ne devient pas une version livrée et une CI verte ne livre rien',()=>{
  const result=projectDevelopmentVersions({candidate:{codeSourceSha:'a'.repeat(40)},checks:[{kind:'production',status:'passed'}]},{});assert.equal(result.candidate.sourceSha,'a'.repeat(40));assert.deepEqual(result.declarations,[]);
});
test('une livraison sans environnement qualifié ne remplit aucune colonne hébergée',()=>{
  const raw={stage:'production',delivery:{status:'delivered',sourceSha:'a'.repeat(40),target:'https://preprod.invalid'}};assert.deepEqual(projectDevelopmentVersions(raw,{}).declarations,[]);const result=projectDevelopmentVersions(raw,{deliveryEnvironment:'preproduction'});assert.equal(result.declarations[0].environment,'preproduction');assert.equal(result.declarations[0].scope,'declared_lot_not_full_application');
});
test('la dernière déclaration datée est sélectionnée, jamais la dernière date de lecture',async t=>{
  const root=await fixture(t);for(const [id,date,char]of [['old','2026-10-01','a'],['new','2026-11-06','b']])await writeFile(join(root,id+'.json'),JSON.stringify({iterationId:id,stage:'preproduction',delivery:{status:'delivered',sourceSha:char.repeat(40),observedAt:date}}));const store=await createDevelopmentStore(['old','new'].map(id=>({id,root,file:id+'.json',applicationIds:['projet'],deliveryEnvironment:'preproduction'})),{applications:[{id:'projet',name:'Projet'}]});const app=(await store.portfolio())[0];assert.equal(app.preproduction.sourceSha,'b'.repeat(40));assert.equal(app.production,null);
});
test('observation Git distingue le commit de l’application et les changements non commitées',async t=>{
  const root=await fixture(t),app=join(root,'app');await mkdir(app);await writeFile(join(app,'code.txt'),'version 1');const git=args=>execFileSync('git',['-C',root,...args],{stdio:'pipe',windowsHide:true});git(['init']);git(['add','app']);git(['-c','user.name=Fixture','-c','user.email=fixture@example.invalid','commit','-m','fixture']);const clean=await inspectDevelopmentGit(app);assert.equal(clean.status,'observed');assert.equal(clean.dirty,false);assert.match(clean.applicationCommit,/^[a-f0-9]{40}$/);await writeFile(join(app,'code.txt'),'version 2');const dirty=await inspectDevelopmentGit(app);assert.equal(dirty.dirty,true);assert.equal(dirty.headSha,clean.headSha);
});
test('registre inconnu, doublon de catalogue et environnement inventé refusés',async t=>{
  const root=await fixture(t);await writeFile(join(root,'x.json'),'{}');const entry={id:'x',root,file:'x.json'};await assert.rejects(createDevelopmentStore([{...entry,applicationIds:['secret']}],{applications:[{id:'x',name:'X'}]}));await assert.rejects(createDevelopmentStore([entry],{applications:[{id:'x'},{id:'x'}]}));await assert.rejects(createDevelopmentStore([{...entry,deliveryEnvironment:'public'}]));
});
test('une base de preuves déclarée lit data sans autoriser une sortie de racine',async t=>{
  const root=await fixture(t);await mkdir(join(root,'data'));await writeFile(join(root,'data','preuve.md'),'preuve documentaire');await writeFile(join(root,'state.json'),JSON.stringify({iterationId:'x',stage:'local',checks:[{id:'doc',kind:'local',evidence:'preuve.md',status:'reviewable'}]}));const entry={id:'x',root,file:'state.json',evidenceBase:'data'};const store=await createDevelopmentStore([entry]);assert.equal((await store.get('x')).phases[1].proofs[0].availability,'available');assert.equal((await store.proof('x','doc')).content.toString(),'preuve documentaire');await assert.rejects(createDevelopmentStore([{...entry,evidenceBase:'../'}]));
});
