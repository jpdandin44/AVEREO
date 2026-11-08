import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {createDevelopmentStore} from '../workflows/development-store.mjs';
import {latestDeclaredDate,projectDevelopmentVersions} from '../workflows/development-versions.mjs';
async function fixture(t,raw){const root=await mkdtemp(join(tmpdir(),'development-freshness-'));t.after(async()=>{assert.ok(resolve(root).startsWith(resolve(tmpdir())+sep));await rm(root,{recursive:true,force:true});});const file=join(root,'state.json');await writeFile(file,JSON.stringify(raw));return{root,file,entry:{id:'state',root,file:'state.json',writable:false}};}
test('projection RGA : seuls le candidat, les phases et accords du sous-suivi sont présentés',async t=>{
  const raw={iterationId:'parent',stage:'production',candidate:{sourceSha:'a'.repeat(40)},approvals:[{id:'parent'}],developmentReviews:[{id:'parent-review'}],correctiveDeployment:{iterationId:'rga',stage:'preproduction',candidate:{sourceSha:'b'.repeat(40)},checks:[],approvals:[{id:'rga'}],delivery:{status:'delivered',sourceSha:'b'.repeat(40),observedAt:'2026-11-06T22:07:50Z'}}};
  const {entry,file}=await fixture(t,raw),before=await readFile(file),store=await createDevelopmentStore([{...entry,dataPath:'correctiveDeployment',deliveryEnvironment:'preproduction'}]);const view=await store.get('state');assert.equal(view.currentPhase,2);assert.equal(view.iterationId,'rga');assert.equal(view.candidate.sourceSha,'b'.repeat(40));assert.deepEqual(view.declaredApprovals,[{id:'rga'}]);assert.deepEqual(view.history,[]);assert.equal(view.writable,false);assert.equal(view.versions.declarations[0].sourceSha,'b'.repeat(40));assert.deepEqual(await readFile(file),before);
});
test('une projection ne peut jamais opter pour une écriture et un sélecteur dangereux est refusé',async t=>{
  const {entry}=await fixture(t,{iterationId:'x'});for(const dataPath of ['__proto__','constructor.name','nested..value'])await assert.rejects(createDevelopmentStore([{...entry,dataPath}]));await assert.rejects(createDevelopmentStore([{...entry,dataPath:'child',writable:true}]));const missing=await createDevelopmentStore([{...entry,dataPath:'absent'}]);assert.equal((await missing.list())[0].unavailable,true);
});
test('phase française de Missions et dossier de qualification : lecture fidèle sans inventer un candidat',async t=>{
  const {entry,root,file}=await fixture(t,{iterationId:'missions',phase:'Développement local',github:{codeSourceSha:'a'.repeat(40)},evidence:'qualification.json',openItems:['Revue métier attendue']});await writeFile(join(root,'qualification.json'),JSON.stringify({observedAt:'2026-11-07',tests:{recherche:23}}));const before=await readFile(file),store=await createDevelopmentStore([entry]);const view=await store.get('state');assert.equal(view.currentPhase,1);assert.equal(view.candidate.sourceSha,'');assert.equal(view.versions.github.headSha,'a'.repeat(40));assert.equal(view.phases[1].proofs[0].availability,'available');assert.equal(view.phases[1].proofs[0].freshness,'unverified');assert.deepEqual(view.blockers,['Revue métier attendue']);assert.deepEqual(await readFile(file),before);
});
test('la dernière donnée datée compare les fuseaux et ne dépend pas de la date de lecture',()=>{
  const data={updatedAt:'2026-11-07T10:00:00+02:00',github:{observedAt:'2026-11-07T09:00:00Z'},checks:[{observedAt:'inconnue'},{observedAt:'2026-11-07T10:30:00Z'}],delivery:{observedAt:'2026-11-06T23:00:00Z'}};assert.equal(latestDeclaredDate(data),'2026-11-07T10:30:00Z');assert.equal(projectDevelopmentVersions(data,{}).updatedAt,'2026-11-07T10:30:00Z');assert.equal(latestDeclaredDate({}),null);
});
test('une réécriture de la source est reflétée immédiatement avec son empreinte, sans cache de statut',async t=>{
  const {entry,file}=await fixture(t,{iterationId:'live',stage:'local',status:'in_progress'}),store=await createDevelopmentStore([entry]);const old=await store.get('state');await writeFile(file,JSON.stringify({iterationId:'live',stage:'preproduction',status:'awaiting_review',updatedAt:'2026-11-07T10:00:00Z'}));const fresh=await store.get('state');assert.equal(fresh.currentPhase,2);assert.equal(fresh.status,'awaiting_review');assert.notEqual(fresh.sourceHash,old.sourceHash);assert.equal(fresh.sourceHash,createHash('sha256').update(await readFile(file)).digest('hex'));assert.equal(fresh.writable,false);
});
test('le tableau et la liste partagent les mêmes données déclarées et les suivis récents passent en premier',async t=>{
  const {root}=await fixture(t,{iterationId:'old',stage:'preproduction',updatedAt:'2026-10-01'});await writeFile(join(root,'recent.json'),JSON.stringify({iterationId:'recent',phase:'Développement local',updatedAt:'2026-11-07'}));const store=await createDevelopmentStore([{id:'old',root,file:'state.json',applicationIds:['recherche']},{id:'recent',root,file:'recent.json',applicationIds:['recherche']}],{applications:[{id:'recherche',name:'Recherche'}]});const data=await store.dashboard();assert.equal(data.portfolio[0].iterations[0].id,'recent');assert.equal(data.portfolio[0].iterations[0].updatedAt,data.iterations.find(i=>i.id==='recent').versions.updatedAt);assert.equal(data.portfolio[0].missingTracking,false);
});
