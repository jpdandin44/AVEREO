import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm,unlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {createDevelopmentStore} from '../workflows/development-store.mjs';
import {observeGithub} from '../workflows/development-github-observations.mjs';
const url='https://github.com/fixture/project/pull/113',a='a'.repeat(40),b='b'.repeat(40);
async function setup(t,data,options={}){const root=await mkdtemp(join(tmpdir(),'development-coherence-'));t.after(async()=>{assert(resolve(root).startsWith(resolve(tmpdir())+sep));await rm(root,{recursive:true,force:true});});const file=join(root,'state.json');await writeFile(file,JSON.stringify(data));const entry={id:'fixture',root,file:'state.json',writable:false,...options};return{root,file,entry,store:await createDevelopmentStore([entry],{adminId:'1',applications:entry.applicationIds?.map(id=>({id,name:id}))||[]})};}
test('une itération est sélectionnée par identité, pas par indice, sans hériter des accords du parent',async t=>{
 const raw={approvals:[{id:'parent'}],developmentIterations:[{iterationId:'old',stage:'production'},{iterationId:'active',stage:'developpement_local',approvals:[{id:'own'}]}]};
 const f=await setup(t,raw,{dataPath:'developmentIterations',iterationKey:'active'}),before=await readFile(f.file);const v=await f.store.get('fixture');assert.equal(v.currentPhase,1);assert.deepEqual(v.declaredApprovals,[{id:'own'}]);assert.equal(v.writable,false);
 await assert.rejects(f.store.review('fixture',{action:'comment',comment:'Fixture readonly'}, {id:'1',role:'global_admin'}),e=>e.status===403);assert.deepEqual(await readFile(f.file),before);
 raw.developmentIterations.reverse();await writeFile(f.file,JSON.stringify(raw));assert.equal((await f.store.get('fixture')).iterationId,'active');
});
test('sélecteur absent ou ambigu : aucune retombée silencieuse sur le parent',async t=>{
 const f=await setup(t,{developmentIterations:[{iterationId:'other',stage:'local'}]},{dataPath:'developmentIterations',iterationKey:'wanted'});await assert.rejects(f.store.get('fixture'),e=>e.status===422);
 await writeFile(f.file,JSON.stringify({developmentIterations:[{iterationId:'wanted'},{iterationId:'wanted'}]}));await assert.rejects(f.store.get('fixture'),e=>e.status===422);
 await assert.rejects(createDevelopmentStore([{...f.entry,writable:true}]));
});
test('GitHub fusionné ne modifie ni les phases, ni le statut déclaré, ni les décisions source',async t=>{
 const data={iterationId:'x',stage:'cadrage',github:{prUrl:url,state:'open'},approvals:[{id:'human-existing',status:'accepted'}]},f=await setup(t,data),before=await readFile(f.file),file=join(f.root,'github.json');
 await writeFile(file,JSON.stringify({schema:'development-github-observations',observedAt:'2026-11-09T11:00:00Z',applications:{},pullRequests:{[url]:{number:113,state:'merged',headSha:a,status:'observed'}}}));
 const store=await createDevelopmentStore([f.entry],{githubObservationFile:file});let v=await store.get('fixture');assert.equal(v.versions.github.state,'open');assert.equal(v.currentPhase,0);assert.equal(v.githubObservation.pullRequests[0].state,'merged');assert.equal(v.githubObservation.pullRequests[0].stateDiscrepancy,true);assert.deepEqual(v.declaredApprovals,data.approvals);assert.deepEqual(await readFile(f.file),before);
 await unlink(file);v=await store.get('fixture');assert.equal(v.githubObservation.status,'unavailable');assert.equal(v.githubObservation.pullRequests[0].status,'unavailable');assert.equal(v.githubObservation.observedAt,null);
});
test('les PR déclarées dans les phases et l’alias pr restent observables, sans phase inventée',()=>{
 const d={pr:url,phases:[{id:1,pullRequest:{url,state:'open',headSha:b}},{id:2,pullRequest:{url:'https://github.com/fixture/project/pull/114'}}]},o=observeGithub(d,{}, {status:'observed',observedAt:'2026-11-09',pullRequests:{[url]:{state:'merged',headSha:a}}});assert.equal(o.pullRequests.length,2);assert.equal(o.pullRequests[0].stateDiscrepancy,true);assert.equal(o.pullRequests[0].headDiscrepancy,true);assert.equal(o.pullRequests[1].status,'unavailable');assert.equal(d.phase,undefined);
 assert.equal(observeGithub({github:{prUrl:url,state:'OPEN'}},{},{status:'observed',observedAt:'2026-11-09',pullRequests:{[url]:{state:'open'}}}).pullRequests[0].stateDiscrepancy,false);
});
test('Missions : livraison limitée aux cibles explicites, aucun candidat ou déploiement Recherche fabriqué',async t=>{
 const f=await setup(t,{iterationId:'missions',phase:'Préproduction',github:{codeSourceSha:a},preproduction:{deployment:{status:'installed_and_verified',artifactSha256:'c'.repeat(64),observedAt:'2026-11-07T13:32:58Z'}}},{applicationIds:['rapport','recherche'],deliveryEnvironment:'preproduction',deliveryAdapter:'missions-preproduction',deliveryApplicationIds:['rapport']});
 const store=await createDevelopmentStore([f.entry],{applications:[{id:'rapport',name:'Rapport'},{id:'recherche',name:'Recherche'}]});const p=await store.portfolio();assert.equal(p[0].preproduction.sourceSha,a);assert.equal(p[1].preproduction,null);assert.equal((await store.get('fixture')).candidate.sourceSha,'');assert.equal((await store.get('fixture')).declaredApprovals.length,0);
});
test('un reçu explicitement qualifié est consultatif et ne valide aucun critère',async t=>{
 const f=await setup(t,{sourcePr:url,target:'https://preprod.example.invalid',sourceSha:b,artifactSha256:'d'.repeat(64),deployedAt:'2026-11-08T16:00:00Z'},{recordKind:'receipt',deliveryEnvironment:'preproduction'}),before=await readFile(f.file),v=await f.store.get('fixture');assert.equal(v.currentPhase,2);assert.equal(v.phases[2].proofs[0].availability,'available');assert.equal(v.phases[2].criteria.length,0);assert.deepEqual(v.declaredApprovals,[]);assert.equal((await f.store.portfolio())[0].preproduction.sourceSha,b);assert.deepEqual(await readFile(f.file),before);
 await assert.rejects(createDevelopmentStore([{...f.entry,deliveryEnvironment:undefined}]));
});
test('les états humains de la racine sont conservés seulement si leur mapping est explicite',async t=>{
 const raw={phases:[0,1,2,3].map(id=>({id,status:id===2?'validated':'not_started',criteria:[]})),currentPhase:3,developmentWorkflow:{iterationId:'home',stage:'production',approvals:[{id:'general-human'}],checks:[{id:'unspecified-phase',kind:'project_specific_check',status:'passed'}]}};
 const f=await setup(t,raw,{includeRootPhases:true}),v=await f.store.get('fixture');assert.equal(v.phases[2].status,'validated');assert.equal(v.currentPhase,3);assert.deepEqual(v.declaredApprovals,[{id:'general-human'}]);assert(v.phases.every(p=>p.criteria.length===0));assert.equal(v.writable,false);assert.equal(v.unassignedProofs.length,1);assert.equal(v.unassignedProofs[0].id,'unspecified-phase');
});
