import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,mkdir,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {spawn,spawnSync} from 'node:child_process';
import {once} from 'node:events';
import net from 'node:net';
import vm from 'node:vm';
import {prepareDevelopmentPreproduction} from '../workflows/prepare-development-preproduction.mjs';
import {createDevelopmentFixture} from '../workflows/development-fixture.mjs';
import {exportDevelopmentSnapshot} from '../workflows/development-snapshot-export.mjs';
import {openDevelopmentSnapshotStore,sealDevelopmentSnapshot} from '../workflows/development-snapshot-store.mjs';
const app=resolve(import.meta.dirname,'..'),hash=b=>createHash('sha256').update(b).digest('hex');
test('paquet privé distinct : octets/empreintes, aucun secret/suivi, défaut fermé et aucune écriture Gantt',async t=>{
 const root=await mkdtemp(join(tmpdir(),'projet-package-fixture-'));
 t.after(async()=>{assert(root.startsWith(resolve(tmpdir())+sep)&&root.includes('projet-package-fixture-'));await rm(root,{recursive:true,force:true});});
 const output=join(root,'candidate'),m=await prepareDevelopmentPreproduction(output);
 assert.equal(m.readyToDeploy,false);assert.equal(m.deployed,false);assert.match(m.baseSha,/^[a-f0-9]{40}$/);
 if(m.localUncommitted)assert.equal(m.sourceSha,null);else assert.equal(m.sourceSha,m.baseSha);
 assert.equal(hash(JSON.stringify(m.files)),m.artifactSha256);
 for(const f of m.files)assert.equal(hash(await readFile(join(output,'package',f.path))),f.sha256);
 assert(m.files.every(f=>!f.path.includes('planning')&&!f.path.includes('suivi-')&&!f.path.includes('publication-key')));
 assert.equal(await readFile(join(output,'package/private/runtime/SignedMessage.php'),'utf8'),await readFile(resolve(app,'../avereo-app-connect/backend/src/Developments/SignedMessage.php'),'utf8'));
 assert.match(await readFile(join(output,'package/configuration/developments.example.php'),'utf8'),/'enabled'=>false/);
 const html=await readFile(join(output,'package/private/assets/index.html'),'utf8');assert(!html.includes('/assets/'));assert(html.includes('/developpements/api.php?route=asset&amp;name='));
 const entry=join(output,'package/public/developpements/index.php').replaceAll('\\','/');
 const p=spawnSync('php',['-d','display_errors=1','-r','include '+JSON.stringify(entry)+'; echo "\\nSTATUS:".http_response_code();'],{encoding:'utf8',windowsHide:true});
 assert.equal(p.status,0,p.stderr);assert.equal(p.stdout.trim(),'{"error":"Espace privé indisponible."}\\nSTATUS:503'.replace('\\n','\n'));
 await assert.rejects(prepareDevelopmentPreproduction(output),/Préserver/);
 await assert.rejects(prepareDevelopmentPreproduction(join(app,'frontend','forbidden')),/hors dépôt/);
 // Native-cookie HTTP exercise on fictitious data only.
 const storage=join(root,'storage');await mkdir(storage);
 const entries=(await createDevelopmentFixture(join(root,'sources'))).map(e=>({...e,writable:false}));
 const data=await exportDevelopmentSnapshot({schema:'development-portfolio-registry',entries,applications:entries.map(e=>({id:e.id,name:e.application}))},{sequence:1,proofSelection:[{iterationId:'demo-formulaire',proofId:'demo-parcours'}]});
 const publicationKey='K'.repeat(64),store=await openDevelopmentSnapshotStore({directory:storage,key:publicationKey});await store.importSnapshot(sealDevelopmentSnapshot(data,publicationKey));
 const listener=net.createServer();await new Promise(r=>listener.listen(0,'127.0.0.1',r));const port=listener.address().port;await new Promise(r=>listener.close(r));
 const roleFile=join(root,'role.json');await writeFile(roleFile,'{"allowed":true}');
 const config=join(root,'fixture.json');await writeFile(config,JSON.stringify({port,storage,publicationKey,assets:join(output,'package/private/assets'),roleFile}));
 const server=spawn('php',['-S','127.0.0.1:'+port,join(app,'tests/development-session-router.php')],{env:{...process.env,PROJET_SESSION_FIXTURE_CONFIG:config},windowsHide:true,stdio:'ignore'});
 t.after(async()=>{server.kill();if(server.exitCode===null)await once(server,'exit');});
 const origin='http://127.0.0.1:'+port;let started=false;for(let i=0;i<30;i++){try{await fetch(origin);started=true;break;}catch{await new Promise(r=>setTimeout(r,50));}}assert(started);
 assert.equal((await fetch(origin+'/developpements/api.php?route=state')).status,401);
 const login=await fetch(origin+'/fixture-login',{redirect:'manual'}),cookie=login.headers.get('set-cookie').split(';')[0];assert.match(login.headers.get('set-cookie'),/HttpOnly/i);
 const get=path=>fetch(origin+path,{headers:{Cookie:cookie}});
 const page=await get('/developpements/');assert.equal(page.status,200);const pageHtml=await page.text();
 const assets=[...pageHtml.matchAll(/(?:src|href)="([^"]+route=asset[^"]+)"/g)].map(x=>x[1].replaceAll('&amp;','&'));assert(assets.length>=2);
 for(const path of assets){const r=await get(path);assert.equal(r.status,200);assert.equal(r.headers.get('cache-control'),'no-store, private');}
 const state=await get('/developpements/api.php?route=state');assert.equal((await state.json()).portfolio.length,2);
 const proofPath='/developpements/api.php?route=proof&iteration=demo-formulaire&proof=demo-parcours';
 assert.match(await(await get(proofPath)).text(),/fictive/);
 assert.equal((await fetch(origin+'/developpements/api.php?route=state',{method:'POST',headers:{Cookie:cookie}})).status,405);
 await writeFile(roleFile,'{"allowed":false}');
 for(const path of ['/developpements/','/developpements/api.php?route=state',proofPath,...assets])assert.equal((await get(path)).status,403,path);
});
test('menu optionnel : aucun lien sans confirmation du propriétaire global et session signée',async()=>{
 const source=await readFile(join(app,'backend/developments/public/module-link.js'),'utf8');
 for(const data of [null,{available:true,scope:'single_global_administrator',identity:{connectRoleVerified:false,connectSsoVerified:false}},{available:true,scope:'single_global_administrator',identity:{connectRoleVerified:true,connectSsoVerified:true}}]){
  const events={},nodes=new Map(),menu={append(n){nodes.set(n.id,n);}};
  const context={document:{visibilityState:'visible',getElementById:id=>id==='account-menu'?menu:nodes.get(id),createElement:()=>({remove(){nodes.delete(this.id)}}),addEventListener:(n,cb)=>events[n]=cb},window:{addEventListener(){}},fetch:async()=>({ok:!!data,json:async()=>data})};
  vm.runInNewContext(source,context);assert.equal(nodes.size,0);await events.DOMContentLoaded();
  assert.equal(nodes.has('private-development-link'),data?.identity?.connectSsoVerified===true);
 }
});
