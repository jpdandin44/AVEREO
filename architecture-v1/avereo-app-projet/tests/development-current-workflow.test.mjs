import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,mkdir,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {spawnSync} from 'node:child_process';
import {createDevelopmentStore} from '../workflows/development-store.mjs';
import {exportDevelopmentSnapshot} from '../workflows/development-snapshot-export.mjs';
import {openDevelopmentSnapshotStore,sealDevelopmentSnapshot} from '../workflows/development-snapshot-store.mjs';
const a='a'.repeat(40),b='b'.repeat(64),key='fixture-capacity-key-'.repeat(3);
async function fixture(t){const root=await mkdtemp(join(tmpdir(),'current-workflow-'));t.after(async()=>{assert(resolve(root).startsWith(resolve(tmpdir())+sep));await rm(root,{recursive:true,force:true});});return root;}
test('workflow actif imbriqué : candidat, phase, PR, contrôle et accords propres, sans héritage du parent',async t=>{
 const root=await fixture(t),file=join(root,'source.json');
 const data={parent:{activeIteration:'current',approvals:[{id:'parent'}],current:{status:'envelope',approvals:[{id:'envelope'}],developmentWorkflow:{iterationId:'actual',stage:'preproduction',status:'installed',candidate:{sourceSha:a,artifactSha256:b},github:{prUrl:'https://github.com/fixture/app/pull/170'},delivery:{status:'delivered',sourceSha:a,artifactSha256:b,target:'shared',observedAt:'2026-11-18',evidence:'receipt.json'},checks:[{kind:'preproduction',status:'passed',sourceSha:a,artifactSha256:b,target:'shared',observedAt:'2026-11-18',evidence:'receipt.json'}],approvals:[{id:'own'}]}}}};
 await writeFile(file,JSON.stringify(data));const before=await readFile(file);
 const e={id:'current',root,file:'source.json',writable:false,dataPath:'parent',followActiveIteration:true,deliveryEnvironment:'preproduction',applicationIds:['rapport','connect']};
 const store=await createDevelopmentStore([e],{applications:[{id:'rapport',name:'Rapport'},{id:'connect',name:'CONNECT'}]});
 const v=await store.get('current');assert.equal(v.currentPhase,2);assert.equal(v.iterationId,'actual');assert.equal(v.status,'installed');assert.equal(v.candidate.sourceSha,a);assert.equal(v.dataPath,'parent.current');assert.deepEqual(v.declaredApprovals,[{id:'own'}]);assert.equal(v.versions.declarations[0].verification.status,'documented');
 for(const row of await store.portfolio())assert.equal(row.preproduction.sourceSha,a);
 assert.deepEqual(await readFile(file),before);
 data.parent.current.developmentWorkflow=[];await writeFile(file,JSON.stringify(data));await assert.rejects(store.get('current'),e=>e.status===422);
});
test('sous-suivi figé : dérouler son workflow sans importer les accords de son conteneur',async t=>{
 const root=await fixture(t);await writeFile(join(root,'source.json'),JSON.stringify({container:{approvals:[{id:'outer'}],developmentWorkflow:{stage:'local',candidate:{sourceSha:a}}}}));
 const store=await createDevelopmentStore([{id:'old',root,file:'source.json',writable:false,dataPath:'container'}]);const v=await store.get('old');assert.equal(v.currentPhase,1);assert.equal(v.candidate.sourceSha,a);assert.deepEqual(v.declaredApprovals,[]);
});
test('100 vues : export, stockage signé, lecteur PHP et retour gardent chaque historique ; 101 refusées',async t=>{
 const root=await fixture(t);await writeFile(join(root,'source.json'),JSON.stringify({stage:'local',candidate:{sourceSha:a},approvals:[{id:'existing-human'}]}));
 const entries=Array.from({length:100},(_,n)=>({id:'view-'+n,root,file:'source.json',writable:false,applicationIds:['one']}));
 const registry={schema:'development-portfolio-registry',applications:[{id:'one',name:'One'}],entries};
 const data=await exportDevelopmentSnapshot(registry,{sequence:1});assert.equal(data.iterations.length,100);assert(data.iterations.every(v=>v.declaredApprovals[0].id==='existing-human'));
 const directory=join(root,'store');await mkdir(directory);await writeFile(join(root,'key'),key);
 const store=await openDevelopmentSnapshotStore({directory,key});await store.importSnapshot(sealDevelopmentSnapshot(data,key));
 assert.equal((await store.dashboard()).iterations.length,100);
 const php=resolve(import.meta.dirname,'../backend/developments').replaceAll('\\','/');
 const code=`require $argv[1].'/Failure.php';require $argv[1].'/SnapshotReader.php';$r=new Avereo\\Projet\\Developments\\SnapshotReader($argv[2],trim(file_get_contents($argv[3])));echo count($r->state()['iterations']);`;
 const run=spawnSync('php',['-r',code,php,directory,join(root,'key')],{encoding:'utf8',windowsHide:true});assert.equal(run.status,0,run.stderr);assert.equal(run.stdout,'100');
 await store.importSnapshot(sealDevelopmentSnapshot({...data,sequence:2},key));await store.restorePrevious();assert.equal((await store.dashboard()).snapshot.sequence,1);assert.equal((await store.dashboard()).iterations.length,100);
 await assert.rejects(createDevelopmentStore([...entries,{...entries[0],id:'extra'}]));
 const excess=structuredClone(data);excess.iterations.push({...excess.iterations[0],id:'extra'});assert.throws(()=>sealDevelopmentSnapshot(excess,key));
});

test('quatre phases sans id : mapping explicite des libellés, critères et pièces sans héritage humain',async t=>{
 const root=await fixture(t),labels=['Cadrage','Développement local','Préproduction','Mise en production'];
 const phases=labels.map((label,i)=>({label,status:i===2?'awaiting_review':'documented',criteria:[{id:'criterion-'+i,title:'Critère '+i}],deliverables:[{path:'proof-'+i+'.md'}],plan:{start:'2026-11-18',end:'2026-11-19'}}));
 const source={parent:{approvals:[{id:'parent-only'}],developmentWorkflow:{iterationId:'label-workflow',currentPhase:2,phases,approvals:[{id:'own-existing'}]}}};
 const bytes=JSON.stringify(source);await writeFile(join(root,'source.json'),bytes);
 for(let i=0;i<4;i++)await writeFile(join(root,'proof-'+i+'.md'),'Fixture '+i);
 const entry={id:'labels',root,file:'source.json',dataPath:'parent',writable:false};
 const unmapped=await createDevelopmentStore([entry]);await assert.rejects(unmapped.get('labels'),e=>e.status===422);
 const phaseMap=Object.fromEntries(labels.map((label,i)=>[label,i]));
 const store=await createDevelopmentStore([{...entry,phaseMap}]),view=await store.get('labels');
 assert.equal(view.currentPhase,2);assert.deepEqual(view.declaredApprovals,[{id:'own-existing'}]);
 for(let i=0;i<4;i++){const p=view.phases[i];assert.equal(p.criteria[0].id,'criterion-'+i);assert.equal(p.criteria[0].phaseId,i);assert.equal(p.proofs[0].phaseId,i);assert.equal(p.proofs[0].availability,'available');assert.deepEqual(p.plan,phases[i].plan);}
 assert.equal(await readFile(join(root,'source.json'),'utf8'),bytes);
 source.parent.developmentWorkflow.phases[0].label='Unqualified';await writeFile(join(root,'source.json'),JSON.stringify(source));
 await assert.rejects(store.get('labels'),e=>e.status===422);
});

test('pièce historique JPEG déclarée PNG : conserver octets et identité, corriger seulement le transport dérivé',async t=>{
 const root=await fixture(t),content=Buffer.from([255,216,255,224,0,2,255,217]);
 await writeFile(join(root,'capture.png'),content);await writeFile(join(root,'source.json'),JSON.stringify({stage:'local',proofs:[{id:'image',kind:'document',evidence:'capture.png',status:'reviewable'}]}));
 const registry={schema:'development-portfolio-registry',entries:[{id:'legacy',root,file:'source.json',writable:false,applicationIds:['one']}],applications:[{id:'one',name:'One'}]};
 const data=await exportDevelopmentSnapshot(registry,{sequence:1,proofSelection:[{iterationId:'legacy',proofId:'image'}]});
 assert.throws(()=>sealDevelopmentSnapshot(data,key),/Image invalide/);
 const before=structuredClone(data.proofs[0]);data.proofs[0].originalDeclaredExt='.png';data.proofs[0].ext='.jpg';
 assert.doesNotThrow(()=>sealDevelopmentSnapshot(data,key));
 for(const field of ['iterationId','proofId','sha256','content'])assert.equal(data.proofs[0][field],before[field]);
 assert.deepEqual(await readFile(join(root,'capture.png')),content);
});
