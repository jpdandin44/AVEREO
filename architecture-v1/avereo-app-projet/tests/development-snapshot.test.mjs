import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,readdir,rm,symlink} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {createHmac} from 'node:crypto';
import {createDevelopmentFixture} from '../workflows/development-fixture.mjs';
import {exportDevelopmentSnapshot} from '../workflows/development-snapshot-export.mjs';
import {openDevelopmentSnapshotStore,sealDevelopmentSnapshot} from '../workflows/development-snapshot-store.mjs';
const key='k'.repeat(64);
test('export : liens HTTPS GitHub intacts, chemins privés toujours masqués et sources consultatives',async t=>{
 const {registry}=await setup(t);
 const urls=['https://github.com/exemple/application/pull/136','https://github.com/exemple/application/commit/'+'a'.repeat(40),'https://github.com/exemple/application/actions/runs/123?check_suite_focus=true#jobs'];
 registry.entries[0].githubPrUrls=[urls[0]];
 for(const url of urls){
  registry.entries[0].title=url;
  const data=await exportDevelopmentSnapshot(registry,{sequence:1});
  assert.equal(data.iterations[0].title,url);
  assert.equal(data.iterations[0].githubObservation.pullRequests[0].url,urls[0]);
  assert.ok(data.iterations.every(i=>i.writable===false));
  assert.equal(data.proofs.length,0);
 }
 for(const path of ['C:/Users/fixture/prive/suivi.json','c:\\Users\\fixture\\prive\\suivi.json','/home/fixture/prive/suivi.json']){
  registry.entries[0].title=path;
  const data=await exportDevelopmentSnapshot(registry,{sequence:1});
  assert.match(data.iterations[0].title,/\[chemin (?:local|serveur) masqué\]/);
  assert.ok(!JSON.stringify(data).includes(path));
 }
});
const sign=x=>{const payload=JSON.stringify(x);return{payload,signature:createHmac('sha256',key).update(payload).digest('hex')};};
async function setup(t){
 const root=await mkdtemp(join(tmpdir(),'snapshot-fixture-'));const {mkdir}=await import('node:fs/promises');const storage=join(root,'private');await mkdir(storage);
 const entries=(await createDevelopmentFixture(join(root,'sources'))).map(e=>({...e,writable:false}));const registry={schema:'development-portfolio-registry',entries,applications:entries.map(e=>({id:e.id,name:e.application}))};
 const before=await Promise.all(entries.map(e=>readFile(join(e.root,e.file),'utf8')));
 t.after(async()=>{assert.deepEqual(await Promise.all(entries.map(e=>readFile(join(e.root,e.file),'utf8'))),before);assert.ok(resolve(root).startsWith(resolve(tmpdir())+sep));await rm(root,{recursive:true,force:true});});
 const make=sequence=>exportDevelopmentSnapshot(registry,{sequence,proofSelection:[{iterationId:'demo-formulaire',proofId:'demo-parcours'}]});
 return{root,storage,registry,make,store:await openDevelopmentSnapshotStore({directory:storage,key,publicRoots:[join(root,'public')]})};
}
test('projection privée : sources inchangées, seules pièces sélectionnées, redémarrage et consultation',async t=>{
 const {storage,make,store}=await setup(t),data=await make(1);assert.equal(data.proofs.length,1);assert.ok(data.iterations.every(i=>i.writable===false&&!i.source.includes(':\\')));
 await store.importSnapshot(sealDevelopmentSnapshot(data,key));assert.equal((await store.dashboard()).portfolio.length,2);
 const restarted=await openDevelopmentSnapshotStore({directory:storage,key});assert.equal((await restarted.get('demo-formulaire')).writable,false);
 assert.match((await restarted.proof('demo-formulaire','demo-parcours')).content.toString(),/fictive/);
 await assert.rejects(restarted.proof('demo-formulaire','demo-droits'),/non publiée/);await assert.rejects(restarted.review(),/consultative/);
});
test('publication authentifiée, séquences et restauration sans abaisser le seuil anti-rejeu',async t=>{
 const {store,make}=await setup(t);const a=sealDevelopmentSnapshot(await make(1),key);await store.importSnapshot(a);
 await assert.rejects(store.importSnapshot(a),/ancienne/);await store.importSnapshot(sealDevelopmentSnapshot(await make(2),key));
 await store.restorePrevious();assert.equal((await store.dashboard()).snapshot.sequence,1);assert.equal((await store.dashboard()).snapshot.restored,true);
 await assert.rejects(store.importSnapshot(sealDevelopmentSnapshot(await make(2),key)),/ancienne/);
 await store.importSnapshot(sealDevelopmentSnapshot(await make(3),key));assert.equal((await store.dashboard()).snapshot.sequence,3);
});
test('paquets altérés ou partiels refusés avant toute écriture',async t=>{
 const {store,make,storage}=await setup(t),data=await make(1);const initial=await readdir(storage);
 const bad=sealDevelopmentSnapshot(data,key);bad.signature='0'.repeat(64);await assert.rejects(store.importSnapshot(bad));
 for(const mutate of [d=>d.proofs[0].content='eA==',d=>d.proofs=[],d=>d.iterations[0].writable=true,d=>d.iterations[0].phases.pop(),d=>d.proofs[0].ext='.html',d=>d.proofs[0].proofId='../secret',d=>d.schema='wrong']){
  const copy=structuredClone(data);mutate(copy);await assert.rejects(store.importSnapshot(sign(copy)));
 }
 assert.deepEqual(await readdir(storage),initial);
});
test('index et contenu corrompus ne sont jamais réparés par écrasement silencieux',async t=>{
 const {store,make,storage}=await setup(t);await store.importSnapshot(sealDevelopmentSnapshot(await make(1),key));
 const files=await readdir(storage),snapshot=files.find(f=>f.endsWith('.snapshot.json'));await writeFile(join(storage,snapshot),'{}');
 await assert.rejects(store.dashboard());await assert.rejects(store.importSnapshot(sealDevelopmentSnapshot(await make(2),key)));
 const before=await readFile(join(storage,'index.json'),'utf8');assert.equal(await readFile(join(storage,'index.json'),'utf8'),before);
 await writeFile(join(storage,'index.json'),'{corrompu');await assert.rejects(store.importSnapshot(sealDevelopmentSnapshot(await make(3),key)));
 assert.equal(await readFile(join(storage,'index.json'),'utf8'),'{corrompu');
});
test('racine publique, lecture vide, quotas et export sans opt-in refusés',async t=>{
 const {store,make,storage,registry}=await setup(t);await assert.rejects(store.dashboard(),/Aucune projection/);
 await assert.rejects(openDevelopmentSnapshotStore({directory:storage,key,publicRoots:[storage]}),/publique/);
 const bounded=await openDevelopmentSnapshotStore({directory:storage,key,maxSnapshots:2});await bounded.importSnapshot(sealDevelopmentSnapshot(await make(1),key));await bounded.importSnapshot(sealDevelopmentSnapshot(await make(2),key));
 await assert.rejects(bounded.importSnapshot(sealDevelopmentSnapshot(await make(3),key)),/Quota/);assert.equal((await bounded.dashboard()).snapshot.sequence,2);
 const bad=structuredClone(registry);bad.entries[0].writable=true;await assert.rejects(exportDevelopmentSnapshot(bad,{sequence:1}),/consultatives/);
});
test('aucune preuve copiée implicitement et chemins physiques masqués',async t=>{
 const {registry}=await setup(t);const data=await exportDevelopmentSnapshot(registry,{sequence:1});assert.equal(data.proofs.length,0);
 assert.ok(data.iterations.flatMap(i=>i.phases.flatMap(p=>p.proofs)).every(p=>p.availability!=='available'));
 assert.ok(data.iterations.every(i=>i.source.startsWith('source-privee:')));
});

test('publication privée : fusions GitHub conservées et pièce sans phase sélectionnée compatible Node/PHP',async t=>{
 const {storage,make,store}=await setup(t),data=await make(1),iteration=data.iterations.find(v=>v.id==='demo-formulaire');
 const phase=iteration.phases.find(p=>p.proofs.some(p=>p.id==='demo-parcours')),proof=phase.proofs.find(p=>p.id==='demo-parcours');phase.proofs=phase.proofs.filter(p=>p.id!=='demo-parcours');iteration.unassignedProofs=[proof];
 data.githubSnapshot={status:'observed',observedAt:'2026-11-09T12:00:00Z',latestMerges:{fixture:{coverage:'fixture',items:[{number:1,title:'Fusion fictive'}]}}};
 await store.importSnapshot(sealDevelopmentSnapshot(data,key));const state=await store.dashboard();assert.equal(state.githubRefreshAvailable,false);assert.equal(state.githubSnapshot.latestMerges.fixture.items[0].number,1);assert.match((await store.proof('demo-formulaire','demo-parcours')).content.toString(),/fictive/);
 const {execFileSync}=await import('node:child_process');const runtime=resolve(new URL('../backend/developments/',import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1'));
 const script=String.raw`require $argv[1].'/Failure.php';require $argv[1].'/SnapshotReader.php';$r=new \Avereo\Projet\Developments\SnapshotReader($argv[2],$argv[3]);echo json_encode(['state'=>$r->state()['githubSnapshot'],'proof'=>$r->proof('demo-formulaire','demo-parcours')['body']]);`;
 const result=JSON.parse(execFileSync('php',['-r',script,runtime,storage,key],{encoding:'utf8',windowsHide:true}));assert.equal(result.state.latestMerges.fixture.items[0].number,1);assert.match(result.proof,/fictive/);
});
