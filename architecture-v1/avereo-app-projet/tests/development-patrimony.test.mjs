import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,writeFile,readFile,rm,symlink} from 'node:fs/promises';
import {join,resolve,sep} from 'node:path';
import {tmpdir} from 'node:os';
import {spawnSync} from 'node:child_process';
import {createHmac} from 'node:crypto';
import {collectPatrimony,validatePatrimony,readPatrimonyObservation} from '../workflows/development-patrimony.mjs';
import {createDevelopmentFixture} from '../workflows/development-fixture.mjs';
import {exportDevelopmentSnapshot} from '../workflows/development-snapshot-export.mjs';
import {openDevelopmentSnapshotStore,sealDevelopmentSnapshot} from '../workflows/development-snapshot-store.mjs';

async function setup(t){
  const root=await mkdtemp(join(tmpdir(),'patrimony-fixture-'));await mkdir(join(root,'data'));
  for(const d of ['docs','api','tests','prompts','scripts','workflows'])await mkdir(join(root,d));
  const entries=(await createDevelopmentFixture(join(root,'canonical'))).map(e=>({...e,writable:false}));
  const registry={schema:'development-portfolio-registry',entries,applications:entries.map(e=>({id:e.id,name:e.application}))};
  const registryFile=join(root,'registry.json');await writeFile(registryFile,JSON.stringify(registry));
  const date='2026-11-01T10:00:00Z';
  await writeFile(join(root,'data/catalogue-applications.json'),JSON.stringify({observedAt:date,applications:[{id:'rapport',name:'Rapport'},{id:'rapport',name:'Rapport'}]}));
  await writeFile(join(root,'data/inventaire-developpements.json'),JSON.stringify({observedAt:date,repositories:[{path:'C:/private/a'},{path:'c:\\PRIVATE\\a'}],canonicalFiles:{'C:/private/source.json':'a','c:\\private\\SOURCE.json':'a'}}));
  await writeFile(join(root,'data/inventaire-sauvegardes.json'),JSON.stringify({observedAt:date,locations:[{path:'C:/private/backup'},{path:'c:\\PRIVATE\\backup'}]}));
  await writeFile(join(root,'docs/guide.md'),'fixture sentinel, never publish content');
  t.after(async()=>{assert(resolve(root).startsWith(resolve(tmpdir())+sep)&&root.includes('patrimony-fixture-'));await rm(root,{recursive:true,force:true});});
  return {root,registry,registryFile,collect:opts=>collectPatrimony({root,registryFile,...opts})};
}
test('inventaire : comptages dedupliques, sources datees et aucun contenu ou chemin prive',async t=>{
  const f=await setup(t),before=await readFile(f.registryFile),p=await f.collect(),m=id=>p.metrics.find(m=>m.id===id);
  assert.equal(m('applications').value,2);assert.equal(m('references').value,1);assert.equal(m('copies').value,1);assert.equal(m('canonical').value,1);assert.equal(m('backups').value,1);
  assert.equal(m('backups').asOf,'2026-11-01T10:00:00Z');assert.match(m('backups').meaning,/non attestées/);
  assert.equal(m('folder-docs').value,1);assert.equal(m('folder-docs').items[0].label,'docs/guide.md');
  assert(!JSON.stringify(p).includes('fixture sentinel'));assert(!JSON.stringify(p).includes('C:/private'));assert.deepEqual(await readFile(f.registryFile),before);
});
test('source absente ou malformee reste inconnue, et inconnu ne devient pas zero',async t=>{
  const f=await setup(t);await rm(join(f.root,'data/inventaire-sauvegardes.json'));await writeFile(join(f.root,'data/inventaire-developpements.json'),'{');
  const p=await f.collect();for(const id of ['copies','canonical','backups','test-cases','bugs','improvements'])assert.equal(p.metrics.find(m=>m.id===id).value,null);
  assert.equal(p.metrics.find(m=>m.id==='folder-prompts').value,0);
});
test('exclusions, liens et limite bornee sont visibles sans parcours externe',async t=>{
  const f=await setup(t);await mkdir(join(f.root,'docs/node_modules'));await writeFile(join(f.root,'docs/node_modules/dependency.md'),'hidden');await writeFile(join(f.root,'docs/secret.json'),'hidden');await writeFile(join(f.root,'docs/archive.zip'),'binary');await writeFile(join(f.root,'docs/second.md'),'second');
  const external=join(f.root,'canonical');await symlink(external,join(f.root,'docs/external'),process.platform==='win32'?'junction':'dir');
  const p=await f.collect({maxFilesPerFolder:1}),m=p.metrics.find(m=>m.id==='folder-docs');assert.equal(m.status,'partial');assert.equal(m.value,1);assert.equal(m.items.length,1);assert(!JSON.stringify(m).includes('dependency'));assert(!JSON.stringify(m).includes('secret.json'));
});
test('contrat ferme : donnees annexes, comptes invalides, doublons et chemins absolus refuses',async t=>{
  const f=await setup(t),p=await f.collect();
  for(const mutate of [p=>p.secret='never',p=>p.metrics[0].value=-1,p=>p.metrics[0].value=99,p=>p.metrics[0].items[0].label='C:/private/a',p=>p.sources.push(p.sources[0]),p=>p.metrics.push(p.metrics[0]),p=>p.metrics[0].items[0].cookie='bad']){const q=structuredClone(p);mutate(q);assert.throws(()=>validatePatrimony(q));}
  const file=join(f.root,'observation.json');await writeFile(file,JSON.stringify({...p,secret:'bad'}));assert.equal(await readPatrimonyObservation(file),null);assert.equal(await readPatrimonyObservation(null),null);
});
test('clone : index suivi seulement, affectation applicative et exclusions sans lire de contenu',async t=>{
  const f=await setup(t),repo=join(f.root,'depot');await mkdir(repo);
  const run=args=>{const r=spawnSync('git',['-C',repo,...args],{encoding:'utf8',windowsHide:true});assert.equal(r.status,0,r.stderr);};run(['init','--quiet']);
  const dir=join(repo,'architecture-v1/avereo-app-rapport/docs');await mkdir(dir,{recursive:true});await writeFile(join(dir,'guide.md'),'PRIVATE SENTINEL');await writeFile(join(dir,'secret.json'),'PRIVATE SENTINEL');run(['add','.']);await writeFile(join(dir,'untracked.md'),'not indexed');
  f.registry.applications.push({id:'rapport',name:'Rapport'});await writeFile(f.registryFile,JSON.stringify(f.registry));
  const p=await f.collect(),m=p.metrics.find(m=>m.id==='folder-depot');assert.equal(m.value,1);assert.deepEqual(m.items[0].applicationIds,['rapport']);assert(!JSON.stringify(p).includes('PRIVATE SENTINEL'));assert(!JSON.stringify(m).includes('secret.json'));assert(!JSON.stringify(m).includes('untracked.md'));
});
test('projection Node et PHP : inventaire optionnel prive, ancienne copie lisible et source inchangee',async t=>{
  const f=await setup(t),p=await f.collect(),file=join(f.root,'observation.json');await writeFile(file,JSON.stringify(p));f.registry.patrimonyObservationFile=file;
  const data=await exportDevelopmentSnapshot(f.registry,{sequence:1});assert.deepEqual(data.patrimony,p);
  const storage=join(f.root,'snapshot');await mkdir(storage);const key='k'.repeat(64),store=await openDevelopmentSnapshotStore({directory:storage,key});await store.importSnapshot(sealDevelopmentSnapshot(data,key));assert.deepEqual((await store.dashboard()).patrimony,p);
  const runtime=resolve(new URL('../backend/developments',import.meta.url).pathname.replace(/^\/([A-Z]:)/i,'$1'));
  const invoke=()=>spawnSync('php',['-r',"require $argv[1].'/Failure.php';require $argv[1].'/SnapshotReader.php';$r=new Avereo\\Projet\\Developments\\SnapshotReader($argv[2],$argv[3]);echo json_encode($r->state());",runtime,storage,key],{encoding:'utf8',windowsHide:true});
  const result=invoke();assert.equal(result.status,0,result.stderr);assert.deepEqual(JSON.parse(result.stdout).patrimony,p);
  const assets=join(f.root,'assets');await mkdir(assets);
  const runtimeFixture=resolve(new URL('./development-session-fixture.php',import.meta.url).pathname.replace(/^\/([A-Z]:)/i,'$1'));
  const authorized=input=>JSON.parse(spawnSync('php',[runtimeFixture],{input:JSON.stringify({storage,assets,publicationKey:key,route:'state',...input}),encoding:'utf8',windowsHide:true}).stdout);
  const owner=authorized({});assert.equal(owner.status,200);assert.deepEqual(JSON.parse(owner.result.body).patrimony,p);
  for(const [input,status] of [[{anonymous:true},401],[{payload:{identity:{provider:'avereo_connect',id:'102'}}},403],[{hasGlobalRole:false},403],[{server:{REQUEST_METHOD:'POST'}},405]]){const refused=authorized(input);assert.equal(refused.status,status);assert.equal(refused.readerCalls,0);assert(!JSON.stringify(refused).includes('patrimony'));}
  const invalid=structuredClone(data);invalid.patrimony.metrics[0].secret='bad';assert.throws(()=>sealDevelopmentSnapshot(invalid,key));
  const legacy={...data,sequence:2};delete legacy.patrimony;await store.importSnapshot(sealDevelopmentSnapshot(legacy,key));assert.equal(JSON.parse(invoke().stdout).patrimony,null);
  assert.deepEqual(JSON.parse(await readFile(file,'utf8')),p);
  const index=JSON.parse(await readFile(join(storage,'index.json'),'utf8')),ix=JSON.parse(index.payload),payload=JSON.stringify({...invalid,sequence:2}),bad={payload,signature:createHmac('sha256',key).update(payload).digest('hex')};
  await writeFile(join(storage,ix.current.file),JSON.stringify(bad));
  const {createHash}=await import('node:crypto');ix.current.hash=createHash('sha256').update(JSON.stringify(bad)).digest('hex');
  const indexPayload=JSON.stringify(ix);await writeFile(join(storage,'index.json'),JSON.stringify({payload:indexPayload,signature:createHmac('sha256',key).update(indexPayload).digest('hex')}));
  const refused=authorized({});assert.equal(refused.status,503);assert(!JSON.stringify(refused).includes('secret'));
});
