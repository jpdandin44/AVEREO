import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,readdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {runPrivatePublisher,githubReadRequest,semanticSnapshot,retainPublishedHistory} from '../workflows/development-private-publisher.mjs';
import {openDevelopmentSnapshotStore,sealDevelopmentSnapshot} from '../workflows/development-snapshot-store.mjs';
import {signPublisherStatus,readPublisherStatus} from '../workflows/development-publisher-status.mjs';
import {exportDevelopmentSnapshot} from '../workflows/development-snapshot-export.mjs';
import {developmentFreshness,publicationReloadNotice} from '../frontend/src/developments/development-freshness.mjs';
const key='private-fixture-publication-'.repeat(3),a='a'.repeat(40),b='b'.repeat(40),digest=x=>createHash('sha256').update(x).digest('hex');
const observed='2026-11-19T10:00:00Z';
const request=async endpoint=>endpoint.includes('/branches/main')?{commit:{sha:a}}:endpoint.includes('/git/trees/')?{sha:b,tree:[]}:endpoint.includes('/pulls?')?[]:Promise.reject(Error('Unexpected fixture endpoint'));
async function fixture(t){
 const root=await mkdtemp(join(tmpdir(),'publisher-fixture-'));t.after(()=>rm(root,{recursive:true,force:true}));
 for(const d of ['storage','archive','backups','work','sources'])await mkdir(join(root,d),{mode:0o700});
 const file=join(root,'sources','source.json'),source=JSON.stringify({iterationId:'one',stage:'local',candidate:{sourceSha:a,artifactSha256:'c'.repeat(64)},approvals:[{id:'existing-human',status:'approved'}]});
 const json=async(p,v)=>writeFile(p,JSON.stringify(v),{mode:0o600});await writeFile(file,source,{mode:0o600});
 const registry={schema:'development-portfolio-registry',applications:[{id:'one',name:'One'}],entries:[{id:'one',root:join(root,'sources'),file:'source.json',applicationIds:['one'],writable:false}],githubObservationFile:join(root,'github.json')};
 await json(join(root,'registry.json'),registry);await json(join(root,'receipt.json'),{schema:'avereo-private-source-receipt',version:1,receivedAt:'2026-11-18T10:00:00Z',sourceHashes:{[file]:digest(source)}});
 await json(join(root,'github.json'),{schema:'development-github-observations',observedAt:'2026-11-18T10:00:00Z',applications:{one:{repository:'fixture/app',path:''}},pullRequests:{},repositories:{},latestMerges:{}});
 await writeFile(join(root,'key'),key,{mode:0o600});await writeFile(join(root,'token'),'github_pat_fixture_only',{mode:0o600});
 const store=await openDevelopmentSnapshotStore({directory:join(root,'storage'),key});
 const initial=await exportDevelopmentSnapshot(registry,{sequence:1,publisherId:'private-host-operator'});await store.importSnapshot(sealDevelopmentSnapshot(initial,key));
 const config={schema:'avereo-private-publisher',version:1,enabled:true,environment:'preproduction',intervalSeconds:300,privateRoot:root,publicRoots:[join(root,'web')],registryFile:join(root,'registry.json'),sourceReceiptFile:join(root,'receipt.json'),githubCacheFile:join(root,'github.json'),publicationKeyFile:join(root,'key'),githubTokenFile:join(root,'token'),storageDirectory:join(root,'storage'),archiveDirectory:join(root,'archive'),backupDirectory:join(root,'backups'),workDirectory:join(root,'work'),repositories:['fixture/app']};
 return{root,config,store,file,source,initial};
}
test('publicateur réel : collecte complète, publication signée, source/accords intacts, puis contrôle sans fausse nouvelle version',async t=>{
 const f=await fixture(t),first=await runPrivatePublisher(f.config,{requestGithub:request,now:()=>observed});assert(first.published);assert.equal(first.sequence,2);assert.equal(await readFile(f.file,'utf8'),f.source);
 const current=await f.store.readCurrent();assert.deepEqual(current.data.iterations[0].declaredApprovals,[{id:'existing-human',status:'approved'}]);
 const second=await runPrivatePublisher(f.config,{requestGithub:request,now:()=> '2026-11-19T10:05:00Z'});assert.equal(second.published,false);assert.equal(second.sequence,2);
 const status=readPublisherStatus(await readFile(join(f.root,'storage','publisher-status.json'),'utf8'),key);assert.equal(status.lastSuccessAt,'2026-11-19T10:05:00Z');assert.equal(status.sourcesReceivedAt,'2026-11-18T10:00:00Z');assert.equal(status.sequence,2);
 assert.equal((await readdir(join(f.root,'backups'))).length,1);assert.equal((await f.store.dashboard()).publisherStatus.status,'ok');
});
test('échec GitHub : ancienne projection conservée et panne signée, sans date de réussite inventée',async t=>{
 const f=await fixture(t);await assert.rejects(runPrivatePublisher(f.config,{requestGithub:async()=>{throw Error('private token must never be returned');},now:()=>observed}),/private_publication_failed/);
 assert.equal((await f.store.readCurrent()).data.sequence,1);const bytes=await readFile(join(f.root,'storage','publisher-status.json'),'utf8');assert(!bytes.includes('token'));const s=readPublisherStatus(bytes,key);assert.equal(s.status,'failed');assert.equal(s.lastSuccessAt,null);
});
test('source concurrente : aucun remplacement partiel, aucun écrasement du nouveau suivi',async t=>{
 const f=await fixture(t);let changed=false;await assert.rejects(runPrivatePublisher(f.config,{now:()=>observed,requestGithub:async p=>{if(!changed){changed=true;await writeFile(f.file,'{"iterationId":"newer"}',{mode:0o600});}return request(p);}}),/private_publication_failed/);
 assert.equal((await f.store.readCurrent()).data.sequence,1);assert.equal(await readFile(f.file,'utf8'),'{"iterationId":"newer"}');
});
test('refus de la production, du mode inactif et d’une zone privée dans le web',async t=>{
 const f=await fixture(t);await assert.rejects(runPrivatePublisher({...f.config,environment:'production'}),/disabled_or_invalid/);await assert.rejects(runPrivatePublisher({...f.config,enabled:false}),/disabled_or_invalid/);await assert.rejects(runPrivatePublisher({...f.config,publicRoots:[f.root]}),/public_root_refused/);
});
test('source non admise et zones confondues refusées',async t=>{
 const f=await fixture(t);await assert.rejects(runPrivatePublisher({...f.config,archiveDirectory:f.config.storageDirectory}),/separate_private_zones/);
 await writeFile(f.file,'{"stage":"production"}',{mode:0o600});await assert.rejects(runPrivatePublisher(f.config,{requestGithub:request,now:()=>observed}),/private_publication_failed/);assert.equal((await f.store.readCurrent()).data.sequence,1);
});
test('archive vérifiée : courante et précédente conservées, ancienne publication récupérable',async t=>{
 const f=await fixture(t),first=(await f.store.readCurrent()).index.current.file;
 for(const n of [2,3]){const d=structuredClone(f.initial);d.sequence=n;await f.store.importSnapshot(sealDevelopmentSnapshot(d,key));}
 assert.equal(await f.store.archiveInactive(f.config.archiveDirectory),1);const old=await readFile(join(f.config.archiveDirectory,first),'utf8');assert(JSON.parse(old).signature);assert.equal((await readdir(f.config.storageDirectory)).filter(n=>n.endsWith('.snapshot.json')).length,2);
 await f.store.restorePrevious();assert.equal((await f.store.readCurrent()).data.sequence,2);assert.equal((await f.store.readCurrent()).index.highWater,3);
});
test('archive altérée : original conservé et courant inchangé',async t=>{
 const f=await fixture(t),first=(await f.store.readCurrent()).index.current.file;
 for(const n of [2,3]){const d=structuredClone(f.initial);d.sequence=n;await f.store.importSnapshot(sealDevelopmentSnapshot(d,key));}
 await writeFile(join(f.config.archiveDirectory,first),'corrupted');await assert.rejects(f.store.archiveInactive(f.config.archiveDirectory));assert(await readFile(join(f.config.storageDirectory,first)));assert.equal((await f.store.readCurrent()).data.sequence,3);
});
test('transport GitHub : GET seulement, périmètre fixe, pas de redirection, pas de classic PAT',async()=>{
 assert.throws(()=>githubReadRequest('ghp_classic',{repositories:['fixture/app']}));const calls=[];
 const api=githubReadRequest('github_pat_fixture',{repositories:['fixture/app'],fetcher:async(url,options)=>{calls.push({url,method:options.method,redirect:options.redirect});return{ok:true,text:async()=>'{"ok":true}'};}});
 assert.deepEqual(await api('repos/fixture/app/branches/main'),{ok:true});await assert.rejects(api('repos/other/private/branches/main'));await assert.rejects(api('repos/fixture/app/../../user'));assert.equal(calls.length,1);assert.equal(calls[0].method,'GET');assert.equal(calls[0].redirect,'error');
});
test('historique de vues et pièces conservé sans transfert d’accords',async t=>{
 const f=await fixture(t),previous=structuredClone(f.initial),next=structuredClone(f.initial);previous.iterations.push({...structuredClone(previous.iterations[0]),id:'archive13-one',declaredApprovals:[{id:'historical'}]});
 previous.portfolio[0].iterations.push({id:'archive13-one',title:'Historic'});const out=retainPublishedHistory(next,previous);assert(out.iterations.some(v=>v.id==='archive13-one'));assert(out.portfolio[0].iterations.some(v=>v.id==='archive13-one'));assert.deepEqual(out.iterations[0].declaredApprovals,[{id:'existing-human',status:'approved'}]);
});
test('fraîcheur : clic récent ne rajeunit pas une ancienne publication ; panne/arrêt/futur refusés',()=>{
 const state={snapshot:{sequence:14,generatedAt:'2026-11-18T10:00:00Z'},githubSnapshot:{observedAt:'2026-11-18T09:00:00Z'}};
 assert.equal(developmentFreshness(state,{now:Date.parse(observed)}).level,'warning');assert.match(publicationReloadNotice(state,state),/inchangée/);
 state.publisherStatus={status:'ok',sequence:14,lastSuccessAt:observed,githubObservedAt:observed,sourcesReceivedAt:'2026-11-18T10:00:00Z',intervalSeconds:300};assert.equal(developmentFreshness(state,{now:Date.parse(observed)}).level,'ok');assert.equal(developmentFreshness(state,{now:Date.parse(observed)+3600000}).level,'error');state.publisherStatus.sequence=15;assert.equal(developmentFreshness(state,{now:Date.parse(observed)}).level,'error');state.publisherStatus.sequence=14;state.publisherStatus.lastSuccessAt='2030-01-01T00:00:00Z';assert.equal(developmentFreshness(state,{now:Date.parse(observed)}).level,'error');
});
test('état signé : altération refusée, état absent/altéré ne casse pas la dernière projection',async t=>{
 const f=await fixture(t);await runPrivatePublisher(f.config,{requestGithub:request,now:()=>observed});const file=join(f.root,'storage','publisher-status.json'),raw=await readFile(file,'utf8');assert.throws(()=>readPublisherStatus(raw.replace('scheduled','changed'),key));await writeFile(file,'bad');assert.equal((await f.store.dashboard()).publisherStatus,null);assert.equal((await f.store.dashboard()).snapshot.sequence,2);
});
test('lecteur PHP : état opérateur signé consultable sans accès en écriture',async t=>{
 const f=await fixture(t);await runPrivatePublisher(f.config,{requestGithub:request,now:()=>observed});
 const php=resolve(import.meta.dirname,'../backend/developments').replaceAll('\\','/');const code='require $argv[1]."/Failure.php";require $argv[1]."/SnapshotReader.php";$r=new Avereo\\Projet\\Developments\\SnapshotReader($argv[2],trim(file_get_contents($argv[3])));echo json_encode($r->state()["publisherStatus"]);';
 const r=spawnSync('php',['-r',code,php,f.config.storageDirectory,f.config.publicationKeyFile],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);assert.equal(JSON.parse(r.stdout).status,'ok');
});
test('nouveau main GitHub : publication automatique, sans changer le candidat ni les accords déclarés',async t=>{
 const f=await fixture(t);await runPrivatePublisher(f.config,{requestGithub:request,now:()=>observed});
 const next='d'.repeat(40),r=await runPrivatePublisher(f.config,{requestGithub:p=>p.includes('/branches/main')?{commit:{sha:next}}:request(p),now:()=> '2026-11-19T10:05:00Z'});
 assert(r.published);const d=(await f.store.readCurrent()).data;assert.equal(d.portfolio[0].github.mainSha,next);assert.equal(d.iterations[0].candidate.sourceSha,a);assert.deepEqual(d.iterations[0].declaredApprovals,[{id:'existing-human',status:'approved'}]);
});
test('retour gardé : une autre publication ne peut pas être remplacée par la récupération de ce job',async t=>{
 const f=await fixture(t);await runPrivatePublisher(f.config,{requestGithub:request,now:()=>observed});await assert.rejects(f.store.restorePrevious({expectedCurrentHash:'0'.repeat(64)}),e=>e.status===409);assert.equal((await f.store.readCurrent()).data.sequence,2);
});
test('projection exportée invalide : ni sauvegarde trompeuse ni remplacement',async t=>{
 const f=await fixture(t);await assert.rejects(runPrivatePublisher(f.config,{requestGithub:request,now:()=>observed,exportSnapshot:async()=>({iterations:[],proofs:[],portfolio:[]})}),/private_publication_failed/);assert.equal((await f.store.readCurrent()).data.sequence,1);assert.equal((await readdir(f.config.backupDirectory)).length,0);
});
test('expiration dédiée : métadonnée visible, avertissement sans modifier les preuves',()=>{
 const state={snapshot:{sequence:1},publisherStatus:{status:'ok',sequence:1,lastSuccessAt:observed,githubObservedAt:observed,sourcesReceivedAt:observed,intervalSeconds:300,credentialExpiresAt:'2026-11-20T10:00:00Z'}};
 assert.equal(developmentFreshness(state,{now:Date.parse(observed)}).level,'warning');assert.match(developmentFreshness(state,{now:Date.parse(observed)}).title,/renouveler/);
});
test('la collecte GitHub conserve l’inventaire privé daté sans nouvelle observation du poste',()=>{
 const old={iterations:[],proofs:[],portfolio:[],patrimony:{asOf:'2026-11-12',metrics:[{value:4}]}};
 const next=retainPublishedHistory({iterations:[],proofs:[],portfolio:[],patrimony:null},old);
 assert.deepEqual(next.patrimony,old.patrimony);assert.notEqual(next.patrimony,old.patrimony);
});
test('une preuve ancienne non rattachable reste dans une vue archivée, sans qualifier le nouveau critère',()=>{
 const p={iterationId:'app',proofId:'proof',sha256:'a'.repeat(64),content:'eA==',ext:'.txt'};
 const old={id:'app',title:'Lot',sourceHash:'b'.repeat(64),iterationId:'lot',dataPath:null,phases:[{proofs:[{id:'proof',fileHash:p.sha256,availability:'available'}]}],unassignedProofs:[]};
 const current={...structuredClone(old),sourceHash:'c'.repeat(64),phases:[{proofs:[{id:'proof',fileHash:null,availability:'unavailable'}]}]};
 const next=retainPublishedHistory({iterations:[current],proofs:[],portfolio:[]},{sequence:14,generatedAt:'2026-11-18T10:00:00Z',iterations:[old],proofs:[p],portfolio:[]});
 const archive=next.iterations.find(v=>v.archivedFrom?.id==='app');assert(archive);assert.equal(next.proofs[0].iterationId,archive.id);assert.equal(next.iterations[0].phases[0].proofs[0].fileHash,null);assert.equal(next.proofs[0].sha256,p.sha256);
});


test('inventaire du compte : plus de cinquante composants transmis à Node/PHP et cycle autonome stable',async t=>{
 const f=await fixture(t);f.config.githubDiscovery={enabled:true,owner:'fixture'};
 const requestInventory=async endpoint=>{
  const u=new URL('https://api.github.com/'+endpoint);
  if(u.pathname==='/user/repos'||u.pathname==='/users/fixture/repos')return[{full_name:'fixture/app',owner:{login:'fixture'}}];
  if(u.pathname==='/repos/fixture/app')return{full_name:'fixture/app',default_branch:'main',private:true,archived:false};
  if(u.pathname.endsWith('/branches/main'))return{commit:{sha:a}};
  if(u.pathname.endsWith('/branches'))return[{name:'main',commit:{sha:a}}];
  if(u.pathname.endsWith('/pulls'))return[];
  if(u.pathname.includes('/git/trees/'))return{sha:b,truncated:false,tree:[{path:'apps',type:'tree',sha:b},...Array.from({length:60},(_,i)=>[{path:'apps/project-'+i,type:'tree',sha:b},{path:'apps/project-'+i+'/package.json',type:'blob',sha:a}]).flat()]};
  if(u.pathname.endsWith('/commits'))return[{sha:a}];
  throw Error('Unexpected fixture endpoint');
 };
 const first=await runPrivatePublisher(f.config,{requestGithub:requestInventory,now:()=>observed});assert(first.published);
 const current=await f.store.readCurrent();assert.equal(current.data.portfolio.length,61);
 const inventory=current.data.githubSnapshot.inventory;assert.equal(inventory.projects.length,61);assert.equal(inventory.treeSnapshots,undefined);
 assert.equal(await readFile(f.file,'utf8'),f.source);assert.deepEqual(current.data.iterations[0].declaredApprovals,[{id:'existing-human',status:'approved'}]);
 assert(current.data.portfolio.filter(p=>p.id!=='one').every(p=>p.missingTracking&&p.iterations.length===0&&p.preproduction===null&&p.production===null));
 const php=resolve(import.meta.dirname,'../backend/developments').replaceAll('\\','/');
 const script=String.raw`require $argv[1].'/Failure.php';require $argv[1].'/SnapshotReader.php';$r=new \Avereo\Projet\Developments\SnapshotReader($argv[2],trim(file_get_contents($argv[3])));echo json_encode($r->state());`;
 const result=spawnSync('php',['-r',script,php,f.config.storageDirectory,f.config.publicationKeyFile],{encoding:'utf8',windowsHide:true});assert.equal(result.status,0,result.stderr);
 const state=JSON.parse(result.stdout);assert.equal(state.portfolio.length,61);assert.deepEqual(state.githubSnapshot.inventory,inventory);
 const second=await runPrivatePublisher(f.config,{requestGithub:requestInventory,now:()=> '2026-11-19T10:05:00Z'});assert.equal(second.published,false);assert.equal(second.sequence,first.sequence);
});
