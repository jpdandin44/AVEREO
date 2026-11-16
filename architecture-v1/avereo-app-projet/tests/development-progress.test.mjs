import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE_LABELS,projectDevelopmentProgress,technicalProofState,observationFreshness,timelineBounds} from '../frontend/src/developments/development-progress.mjs';
import {loadDevelopmentTimeline} from '../frontend/src/developments/development-timeline-loader.mjs';
import {watchGithub} from '../workflows/watch-development-github.mjs';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createDevelopmentStore} from '../workflows/development-store.mjs';
const now=Date.parse('2026-11-16T12:00:00Z'),candidate={sourceSha:'a'.repeat(40),artifactSha256:'b'.repeat(64)};
const proof=(changes={})=>({id:'local',title:'Tests locaux',kind:'local',status:'passed',freshness:'current',availability:'reference',sourceSha:candidate.sourceSha,artifactSha256:candidate.artifactSha256,observedAt:'2026-11-15T12:00:00Z',description:'Résultat',url:'https://github.com/example/repo/actions/runs/1',...changes});
const view=(changes={})=>({id:'one',title:'Lot',currentPhase:0,candidate,phases:PHASE_LABELS.map((label,id)=>({id,label,status:'not_started',proofs:id===1?[proof()]:[],criteria:[]})),history:[{action:'approve',criterionId:'old'}],declaredApprovals:[{scope:'preproduction',status:'approved'}],...changes});
test('quatre phases et déduction technique distincte de la phase déclarée, sans mutation',()=>{
 const source=view(),before=JSON.stringify(source),p=projectDevelopmentProgress(source,{now});
 assert.equal(p.phases.length,4);assert.equal(p.technicalPhase,1);assert.equal(p.declaredPhase,0);assert.equal(p.phaseDiscrepancy,true);assert.equal(p.evidenced,1);assert.equal(JSON.stringify(source),before);
 assert.equal(p.phases[1].evidenceStart,'2026-11-15T12:00:00Z');assert.equal(p.phases[2].status,'not_evidenced');
});
test('absence de données = inconnue, ni zéro travail ni phase terminée',()=>{
 const source=view({phases:PHASE_LABELS.map((label,id)=>({id,label,status:'complete',proofs:[],criteria:[]}))});
 const p=projectDevelopmentProgress(source,{now});assert.equal(p.technicalPhase,null);assert(p.phases.every(v=>v.status==='not_evidenced'&&v.evidenceStart===null));assert.equal(projectDevelopmentProgress({unavailable:true}),null);
});
test('ancienne version, mauvais artefact, date absente ou future : pas de réussite déduite',()=>{
 for(const patch of [{sourceSha:'c'.repeat(40)},{artifactSha256:'c'.repeat(64)},{observedAt:''},{observedAt:'2026-12-16T00:00:00Z'},{freshness:'stale'},{availability:'unavailable'},{observedAt:'2026-02-30'}])assert.equal(technicalProofState(proof(patch),candidate,1,now),'unknown');
 assert.equal(technicalProofState(proof({sourceSha:'',artifactSha256:''}),candidate,1,now),'unknown');
});
test('document à examiner et contexte ne deviennent pas des résultats techniques',()=>{
 assert.equal(technicalProofState(proof({status:'reviewable',kind:'document'}),candidate,1,now),'pending');
 assert.equal(technicalProofState(proof({referenceQualification:{role:'context_not_acceptance_evidence'}}),candidate,1,now),'unknown');
});
test('pièce non copiée : métadonnées éditeur explicitement vérifiées, sans ouvrir la pièce',()=>{
 assert.equal(technicalProofState(proof({availability:'unavailable',sourceAvailability:'available',fileHash:'e'.repeat(64)}),candidate,1,now),'evidenced');
 assert.equal(technicalProofState(proof({availability:'unavailable',sourceAvailability:'available',fileHash:null}),candidate,1,now),'unknown');
});
test('contrôle hébergé exige le type de cible explicite, pas une CI verte',()=>{
 assert.equal(technicalProofState(proof(),candidate,2,now),'unknown');
 assert.equal(technicalProofState(proof({kind:'preproduction',target:'préprod-projet'}),candidate,2,now),'evidenced');
 assert.equal(technicalProofState(proof({kind:'preproduction',target:'préprod-projet'}),candidate,3,now),'unknown');
 assert.equal(technicalProofState(proof({kind:'production',target:'production-projet'}),candidate,3,now),'evidenced');
});
test('critères : toutes les références, échecs et validation humaine séparés',()=>{
 const source=view();source.phases[1].criteria=[{id:'c',title:'Critère',proofIds:['local'],proofs:[proof()],decision:'not_reviewed'}];
 let p=projectDevelopmentProgress(source,{now});assert.equal(p.phases[1].total,1);assert.equal(p.evidenced,1);assert.equal(p.humanRemaining,1);assert.equal(p.phases[1].approved,0);
 source.phases[1].criteria[0].proofIds.push('missing');p=projectDevelopmentProgress(source,{now});assert.equal(p.evidenced,0);assert.equal(p.remaining,1);
 source.phases[1].criteria[0].proofs=[proof({status:'failed'})];p=projectDevelopmentProgress(source,{now});assert.equal(p.phases[1].status,'blocked');
});
test('CI courante sur tête exacte uniquement ; fusion et policy humaine sans avancement automatique',()=>{
 const source=view({githubObservation:{observedAt:'2026-11-16T11:00:00Z',pullRequests:[{url:'https://github.com/example/repo/pull/1',status:'observed',state:'merged',headSha:candidate.sourceSha,checks:[{name:'Tests',status:'completed',conclusion:'success'},{name:'PR Policy',status:'completed',conclusion:'success'}]}]}});
 source.phases[1].proofs=[];let p=projectDevelopmentProgress(source,{now});assert.equal(p.evidenced,1);assert.equal(p.technicalPhase,1);assert.equal(p.phases[2].evidenced,0);
 source.githubObservation.pullRequests[0].headSha='d'.repeat(40);assert.equal(projectDevelopmentProgress(source,{now}).evidenced,0);
 source.githubObservation.pullRequests[0].headSha=candidate.sourceSha;source.githubObservation.observedAt='2026-11-12T11:00:00Z';assert.equal(projectDevelopmentProgress(source,{now}).evidenced,0);
});
test('fraîcheur de collecte distincte des dates de lecture',()=>{
 assert.equal(observationFreshness(null,now),'unknown');assert.equal(observationFreshness('2026-11-12',now),'stale');assert.equal(observationFreshness('2026-11-16T11:00:00Z',now),'current');assert.equal(observationFreshness('2026-12-01',now),'invalid');
});
test('prévisions seulement explicites et valides, axe avec aujourd’hui et reste non daté',()=>{
 const source=view();source.phases[2].plan={start:'2026-11-20',end:'2026-11-25'};let p=projectDevelopmentProgress(source,{now});assert.deepEqual(p.phases[2].plan,source.phases[2].plan);assert.equal(p.phases[2].evidenceStart,null);
 source.phases[2].plan={start:'2026-11-20',end:'2026-11-01'};p=projectDevelopmentProgress(source,{now});assert.equal(p.phases[2].plan,null);
 const bounds=timelineBounds([p],now);assert(bounds.start<now&&bounds.end>now);assert.equal(bounds.position('2020-01-01'),0);assert.equal(bounds.position('2030-01-01'),100);
});
test('lectures Gantt bornées à quatre, cache par publication et nouvelle séquence relue',async()=>{
 const cache=new Map(),state={snapshot:{sequence:13,generatedAt:'2026-11-16'},iterations:Array.from({length:9},(_,i)=>({id:'i'+i}))};let active=0,max=0,calls=0;
 const request=async route=>{calls++;active++;max=Math.max(max,active);await new Promise(r=>setImmediate(r));active--;return{iteration:view({id:decodeURIComponent(route.split('=').at(-1))})};};
 assert.equal((await loadDevelopmentTimeline(state,request,cache)).length,9);assert.equal(max,4);await loadDevelopmentTimeline(state,request,cache);assert.equal(calls,9);
 await loadDevelopmentTimeline({...state,snapshot:{...state.snapshot,sequence:14}},request,cache);assert.equal(calls,18);
});
test('cache local invalidé par GitHub et révision ; source disparue effacée',async()=>{
 const cache=new Map(),state={iterations:[{id:'one',revision:'r1'}],githubSnapshot:{observedAt:'2026-11-15'}};let calls=0;const request=async()=>{calls++;return{iteration:view()};};
 await loadDevelopmentTimeline(state,request,cache);await loadDevelopmentTimeline(state,request,cache);assert.equal(calls,1);
 await loadDevelopmentTimeline({...state,githubSnapshot:{observedAt:'2026-11-16'}},request,cache);assert.equal(calls,2);
 await loadDevelopmentTimeline({...state,iterations:[{id:'one',revision:'r2'}]},request,cache);assert.equal(calls,3);
 await loadDevelopmentTimeline({...state,iterations:[]},request,cache);assert.equal(cache.size,0);
});
test('refus propriétaire/global : vider tout le cache malgré réponses tardives',async()=>{
 const cache=new Map(),state={iterations:Array.from({length:8},(_,i)=>({id:'i'+i}))};let calls=0;
 await assert.rejects(loadDevelopmentTimeline(state,async route=>{calls++;if(route.endsWith('i0'))throw Object.assign(Error('Refus'),{status:403});await new Promise(r=>setTimeout(r,5));return{iteration:view({id:route.split('=').at(-1)})};},cache),{status:403});
 assert.equal(cache.size,0);assert(calls<=4);
});
test('source en erreur : montrer indisponible et ne pas garder son ancien résultat',async()=>{
 const cache=new Map([['one',{version:'old',view:view()}]]);const result=await loadDevelopmentTimeline({iterations:[{id:'one',revision:'new'}]},async()=>{throw Error('Lecture impossible');},cache);
 assert.equal(result[0].unavailable,true);assert.equal(cache.size,0);
});
test('collecte périodique : échec conservé, nouvelle tentative, succès et arrêt sans publication',async()=>{
 const controller=new AbortController(),statuses=[];let attempts=0;
 await watchGithub({refresh:async()=>{if(++attempts===1)throw Error('Réseau');return{observedAt:'2026-11-16'};},signal:controller.signal,onStatus:s=>{statuses.push(s);if(statuses.length===2)controller.abort();},wait:async()=>{}});
 assert.equal(statuses[0].status,'failed');assert.equal(statuses[0].lastGoodObservationPreserved,true);assert.equal(statuses[1].status,'observed');assert(statuses.every(s=>s.remotePublication===false));
});
test('collecte bornée, pas de démarrage implicite ni attente après un cycle unique',async()=>{
 await assert.rejects(watchGithub({refresh:async()=>{},intervalMs:1000}));let count=0;
 await watchGithub({refresh:async()=>{count++;},once:true,wait:async()=>assert.fail('Attente interdite')});assert.equal(count,1);
 const controller=new AbortController();controller.abort();await watchGithub({refresh:async()=>assert.fail('Déjà arrêté'),signal:controller.signal});
});
test('mapping nommé consultatif, types originaux, prévisions et révisions exposés sans toucher au JSON',async()=>{
 const root=await mkdtemp(join(tmpdir(),'gantt-mapping-'));try{
  const data={iterationId:'named',stage:'preproduction',candidate,phases:Object.fromEntries(PHASE_LABELS.map(p=>[p,'in_progress'])),checks:[proof({kind:'hosted_smoke',target:'préprod'})],approvals:[{scope:'preproduction',status:'approved'}]};
  const file=join(root,'source.json');await writeFile(file,JSON.stringify(data));const before=await readFile(file);
  const store=await createDevelopmentStore([{id:'one',root,file:'source.json',writable:false,phaseMap:Object.fromEntries(PHASE_LABELS.map((p,i)=>[p,i])),checkKindMap:{hosted_smoke:'preproduction'}}]);
  const v=await store.get('one');assert.equal(v.phases.length,4);assert.equal(v.currentPhase,2);assert.equal(v.phases[2].proofs[0].kind,'preproduction');assert.equal(v.phases[2].proofs[0].declaredKind,'hosted_smoke');assert.equal((await store.list())[0].revision,v.revision);assert.deepEqual(await readFile(file),before);assert.deepEqual(v.declaredApprovals,data.approvals);
  data.phases=PHASE_LABELS.map((label,id)=>({id,label,status:'in_progress',plan:id===1?{start:'2026-11-16',end:'2026-11-20'}:undefined}));await writeFile(file,JSON.stringify(data));assert.deepEqual((await store.get('one')).phases[1].plan,{start:'2026-11-16',end:'2026-11-20'});
 }finally{await rm(root,{recursive:true,force:true});}
});
test('mapping incomplet refusé au lieu de fabriquer les phases',async()=>{
 const root=await mkdtemp(join(tmpdir(),'gantt-mapping-refus-'));try{
  await writeFile(join(root,'source.json'),JSON.stringify({iterationId:'named',stage:'local',phases:{Cadrage:'complete'}}));
  const store=await createDevelopmentStore([{id:'one',root,file:'source.json',writable:false,phaseMap:{Cadrage:0}}]);await assert.rejects(store.get('one'),/Mapping/);
 }finally{await rm(root,{recursive:true,force:true});}
});
test('contrôles historiques séparés du reste actif, critères non assignés toujours à examiner',()=>{
 const source=view();source.phases[1].proofs.push(proof({id:'old',sourceSha:'d'.repeat(40),freshness:'stale'}));source.unassignedCriteria=[{id:'u',decision:'not_reviewed'}];
 const p=projectDevelopmentProgress(source,{now});assert.equal(p.phases[1].historical,1);assert.equal(p.phases[1].remaining,0);assert.equal(p.unassigned,1);assert.equal(p.humanRemaining,1);assert.equal(p.unquantifiedPhases,3);
});
test('publication changée pendant une lecture de détail refusée par sa révision',async()=>{
 const result=await loadDevelopmentTimeline({snapshot:{sequence:1},iterations:[{id:'one',revision:'original'}]},async()=>({iteration:view({revision:'autre'})}));assert.equal(result[0].unavailable,true);
});
test('pointeur actif : suivre le bon enfant sans hériter du candidat ou des accords du parent',async()=>{
 const root=await mkdtemp(join(tmpdir(),'gantt-active-'));try{
  const child={stage:'development',phases:PHASE_LABELS.map((label,id)=>({id,label,status:'in_progress',criteria:[]})),checks:[],approvals:[],candidate};
  const raw={parent:{activeIteration:'first',candidate:{sourceSha:'f'.repeat(40)},approvals:[{status:'approved'}],first:child,second:{...child,stage:'preproduction'}}};
  const file=join(root,'source.json');await writeFile(file,JSON.stringify(raw));
  const store=await createDevelopmentStore([{id:'one',root,file:'source.json',dataPath:'parent',followActiveIteration:true,writable:false}]);let v=await store.get('one');assert.equal(v.iterationId,'first');assert.equal(v.candidate.sourceSha,candidate.sourceSha);assert.equal(v.declaredApprovals.length,0);assert.equal(v.dataPath,'parent.first');
  raw.parent.activeIteration='second';await writeFile(file,JSON.stringify(raw));v=await store.get('one');assert.equal(v.iterationId,'second');assert.equal(v.currentPhase,2);
  raw.parent.activeIteration='missing';await writeFile(file,JSON.stringify(raw));await assert.rejects(store.get('one'),/active/);
 }finally{await rm(root,{recursive:true,force:true});}
});
