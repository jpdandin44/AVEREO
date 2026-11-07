import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,readFile,writeFile,readdir,rm,realpath} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
import {createDevelopmentFixture} from '../workflows/development-fixture.mjs';
import {exportDevelopmentSnapshot} from '../workflows/development-snapshot-export.mjs';
import {openDevelopmentSnapshotStore,sealDevelopmentSnapshot} from '../workflows/development-snapshot-store.mjs';
const app=resolve(import.meta.dirname,'..'),hash=b=>createHash('sha256').update(b).digest('hex');

test('configuration PHP : défaut fermé, cible préproduction, clés distinctes et stockage séparé',async t=>{
 const f=await setup(t),web=join(f.root,'web'),planning=join(f.root,'planning'),configFile=join(f.root,'planning.php');
 await mkdir(web);await mkdir(planning);await writeFile(join(f.storage,'publication-key'),f.publicationKey,{mode:0o600});
 const plan=origin=>"<?php return ['owner_connect_id'=>'101','origin'=>'"+origin+"','directory'=>'"+planning.replaceAll('\\','/')+"'];";
 await writeFile(configFile,plan('https://projet-preprod.avereo.fr'),{mode:0o600});
 const config={enabled:true,environment:'preproduction',planning_config_file:configFile,storage_directory:f.storage,asset_directory:f.assets,project_channel_key:'P'.repeat(48),connect_authorization_url:'https://connect.fixture.invalid/api/v1/developments/authorize'};
 assert.equal(invoke({...f,action:'factory',public:web,config}).status,200);
 for(const change of [{enabled:false},{environment:'production'},{storage_directory:planning},{storage_directory:web},{asset_directory:planning},{asset_directory:f.storage},{project_channel_key:f.publicationKey},{project_channel_key:'G'.repeat(48)},{connect_authorization_url:'http://connect.fixture.invalid/api/v1/developments/authorize'},{connect_authorization_url:'https://connect.fixture.invalid/wrong'}]){
  assert.equal(invoke({...f,action:'factory',public:web,config:{...config,...change}}).status,503,JSON.stringify(change));
 }
 await writeFile(configFile,plan('https://projet.avereo.fr'),{mode:0o600});
 assert.equal(invoke({...f,action:'factory',public:web,config}).status,503);
});
const invoke=input=>{const p=spawnSync('php',[join(app,'tests/development-session-fixture.php')],{input:JSON.stringify(input),encoding:'utf8',windowsHide:true});assert.equal(p.status,0,p.stderr);return JSON.parse(p.stdout);};
async function setup(t){
  const root=await mkdtemp(join(tmpdir(),'projet-session-fixture-')),storage=join(root,'storage'),assets=join(root,'assets');await mkdir(storage);await mkdir(assets);
  const entries=(await createDevelopmentFixture(join(root,'sources'))).map(e=>({...e,writable:false}));
  const registry={schema:'development-portfolio-registry',entries,applications:entries.map(e=>({id:e.id,name:e.application}))};
  const key='K'.repeat(64),data=await exportDevelopmentSnapshot(registry,{sequence:1,proofSelection:[{iterationId:'demo-formulaire',proofId:'demo-parcours'}]});
  const store=await openDevelopmentSnapshotStore({directory:storage,key});await store.importSnapshot(sealDevelopmentSnapshot(data,key));
  const assetBytes={'index.html':'<!doctype html><html lang="fr">Fixture privée</html>','test.js':'console.log("fixture");','test.css':'body{color:black}'};
  for(const [n,b]of Object.entries(assetBytes))await writeFile(join(assets,n),b);
  await writeFile(join(assets,'assets.json'),JSON.stringify(Object.fromEntries(Object.entries(assetBytes).map(([n,b])=>[n,hash(b)]))));
  const before=await Promise.all(entries.map(e=>readFile(join(e.root,e.file),'utf8')));
  t.after(async()=>{assert.deepEqual(await Promise.all(entries.map(e=>readFile(join(e.root,e.file),'utf8'))),before);assert.ok(resolve(root).startsWith(resolve(tmpdir())+sep)&&root.includes('projet-session-fixture-'));await rm(root,{recursive:true,force:true});});
  return{root,storage,assets,publicationKey:key,store,entries};
}
test('session Projet native signée -> broker CONNECT -> autorité Drupal -> lecteur PHP, sans écriture',async t=>{
 const f=await setup(t),before=await Promise.all((await readdir(f.storage)).map(async n=>[n,hash(await readFile(join(f.storage,n)))]));
 assert.equal(invoke({...f,strictMode:true}).status,403);
 assert.equal(invoke({...f,strictMode:true,server:{HTTP_X_FORWARDED_PROTO:'https'}}).status,403);
 assert.equal(invoke({...f,strictMode:true,server:{HTTPS:'on'}}).status,200);
 for(const route of ['capability','state','index','asset','iteration','proof']){
   const r=invoke({...f,route,query:{name:'test.js',iteration:'demo-formulaire',proof:'demo-parcours'}});
   assert.equal(r.status,200,route);assert.equal(r.transportCalls,1);
   if(route==='state'){const state=JSON.parse(r.result.body);assert.equal(state.portfolio.length,2);assert.equal(state.identity.mode,'project_session_fixture');assert.equal(state.identity.connectSsoVerified,false);}
   if(route==='iteration'){const item=JSON.parse(r.result.body).iteration;assert.equal(item.writable,false);assert.deepEqual(item.phases.map(p=>p.label),['Cadrage','Développement local','Préproduction','Mise en production']);assert(item.phases.flatMap(p=>p.criteria).every(c=>c.canApprove===false));}
   if(route==='proof')assert.match(r.result.body,/fictive/);
 }
 assert.deepEqual(await Promise.all((await readdir(f.storage)).map(async n=>[n,hash(await readFile(join(f.storage,n)))])),before);
});
test('refus avant lecture des suivis : autre compte, session falsifiée ou périmée, rôle perdu et panne',async t=>{
 const f=await setup(t);
 const cases=[
  [{anonymous:true},401], [{tamper:true},401], [{payload:{app:'rapport'}},401], [{payload:{exp:1}},401],
  [{payload:{iat:String(Math.floor(Date.now()/1000))}},401], [{payload:{identity:{provider:'avereo_connect',id:'102'}}},403],
  [{payload:{identity:{provider:'local_private_administrator',id:'101'}}},403],
  [{payload:{identity:{provider:'avereo_connect',id:101}}},403],
  [{hasGlobalRole:false},403],[{roleIsGlobal:false},403],[{drupalActive:false},403],[{accountActive:false},403],[{projectAccess:false},403],
  [{outage:true},403],[{wrongReply:true},403],[{server:{HTTP_HOST:'tiers.invalid'}},403],[{server:{HTTP_ORIGIN:'https://tiers.invalid'}},403],
  [{server:{HTTP_SEC_FETCH_SITE:'same-site'}},403],[{server:{HTTP_SEC_FETCH_SITE:'cross-site'}},403],
 ];
 for(const [change,status]of cases)for(const route of ['state','index','asset','proof']){
   const r=invoke({...f,...change,route,query:{name:'test.js',iteration:'demo-formulaire',proof:'demo-parcours'}});
   assert.equal(r.status,status,JSON.stringify(change));assert.equal(r.readerCalls,0);assert(!JSON.stringify(r).includes('Fiabiliser'));
 }
 for(const method of ['POST','PUT','DELETE','PATCH'])assert.equal(invoke({...f,route:'state',server:{REQUEST_METHOD:method}}).status,405);
});
test('politique existante : révocation de session et période Projet restent appliquées',async t=>{
 const f=await setup(t),policyFile=join(f.root,'policy.json'),now=Math.floor(Date.now()/1000);
 for(const rule of [
  {status:'suspended',not_before:0,not_after:now+3600,applications:['projet'],sessions_revoked_at:0},
  {status:'active',not_before:now+100,not_after:now+3600,applications:['projet'],sessions_revoked_at:0},
  {status:'active',not_before:0,not_after:now+3600,applications:['rapport'],sessions_revoked_at:0},
  {status:'active',not_before:0,not_after:now+3600,applications:['projet'],sessions_revoked_at:now}
 ]){await writeFile(policyFile,JSON.stringify({version:1,accounts:{101:rule}}));const r=invoke({...f,policyFile});assert.equal(r.status,401);assert.equal(r.transportCalls,0);}
});
test('lecteur PHP : intégrité Node compatible, traversées et pièces non publiées refusées',async t=>{
 const f=await setup(t);
 for(const [route,query]of [['asset',{name:'../publication-key'}],['asset',{name:'test.js.map'}],['proof',{iteration:'demo-formulaire',proof:'demo-droits'}],['iteration',{iteration:'../secret'}]])
   assert.equal(invoke({...f,route,query}).status,404);
 const snapshot=(await readdir(f.storage)).find(n=>n.endsWith('.snapshot.json'));await writeFile(join(f.storage,snapshot),'{}');
 assert.equal(invoke({...f}).status,503);assert.equal(await readFile(join(f.storage,snapshot),'utf8'),'{}');
});
