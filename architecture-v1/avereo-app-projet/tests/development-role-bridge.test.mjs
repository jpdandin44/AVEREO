import test from 'node:test';import assert from 'node:assert/strict';import {execFile} from 'node:child_process';import {fileURLToPath} from 'node:url';
import {createServer} from 'node:http';
import {createRoleBridgeClient,signRoleMessage,verifyRoleMessage} from '../workflows/development-role-bridge.mjs';
import {createDevelopmentAccess} from '../workflows/development-access.mjs';
import {createDevelopmentMiddleware} from '../workflows/development-http.mjs';
const key='k'.repeat(64),now=()=>2000000000000;
const good=req=>signRoleMessage({v:1,iss:'avereo-connect-developments',aud:'avereo-projet-developments',type:'response',iat:2000000000,exp:2000000030,nonce:'a'.repeat(48),requestNonce:req.nonce,connectId:'101',active:true,globalAdmin:true,scope:'developments:read'},key);
const actor={id:'101',authenticatedAt:1999999990};
const client=(modify=()=>{},options={})=>createRoleBridgeClient({url:'https://connect.fixture.invalid/api/v1/developments/authorize',key,ownerConnectId:'101',now,fetcher:async(url,options)=>{const req=JSON.parse(Buffer.from(JSON.parse(options.body).payload,'base64url'));const e=good(req);modify(e,req);return new Response(JSON.stringify({data:e}),{status:200});},...options});
test('pont : propriétaire exact, défi courant et signature avant données',async()=>{const result=await client()(actor);assert.equal(result.connectRoleVerified,true);assert.equal(result.connectSsoVerified,false);await assert.rejects(client()({...actor,id:'102'}));});
test('pont : rejeu, audience, délai, rôle et réponse altérée sont refusés',async()=>{
 for(const change of [{globalAdmin:false},{active:false},{connectId:'102'},{scope:'admin'},{aud:'other'},{iss:'other'},{requestNonce:'x'},{exp:1999999999},{iat:2000000010,exp:2000000020}]){
  const c=client(e=>{const p=JSON.parse(Buffer.from(e.payload,'base64url'));Object.assign(p,change);Object.assign(e,signRoleMessage(p,key));});await assert.rejects(c(actor));
 }
 await assert.rejects(client(e=>e.signature='0'.repeat(64))(actor));
 const outage=client(()=>{},{fetcher:async()=>{throw Error('offline');}});await assert.rejects(outage(actor));
 assert.throws(()=>client(()=>{},{url:'http://example.com/api/v1/developments/authorize'}));
});
test('interopérabilité réelle Node -> broker PHP -> autorité Drupal PHP -> Node sur fixtures',async()=>{
 const fixture=fileURLToPath(new URL('../../avereo-app-connect/backend/tests/development-bridge-fixture.php',import.meta.url));
 const {spawn}=await import('node:child_process');
 const c=createRoleBridgeClient({url:'http://127.0.0.1:1/api/v1/developments/authorize',key,ownerConnectId:'101',fixture:true,
  fetcher:async(url,options)=>new Promise((resolve,reject)=>{const p=spawn('php',[fixture],{windowsHide:true,env:{...process.env,DEVELOPMENTS_FIXTURE:'1',DEVELOPMENTS_FIXTURE_KEY:key}});let out='';p.stdout.on('data',x=>out+=x);p.on('error',reject);p.on('exit',code=>resolve(new Response(out,{status:code===0?200:403})));p.stdin.end(options.body);})});
 const reply=await c({id:'101',authenticatedAt:Math.floor(Date.now()/1000)-2});assert.equal(reply.fixture,true);assert.equal(reply.connectRoleVerified,false);
});
test('révocation ou panne : liste, détail, preuve et ressources sont bloqués avant lecture',async t=>{
 let allowed=true,reads=0;const bootstrap='b'.repeat(64);let middleware;
 const server=createServer((q,s)=>middleware(q,s,()=>{reads++;s.end('asset');}));await new Promise(r=>server.listen(0,'127.0.0.1',r));const origin='http://127.0.0.1:'+server.address().port;
 const access=createDevelopmentAccess({adminId:'101',origin,bootstrap});
 middleware=createDevelopmentMiddleware({access,authorize:async()=>{if(!allowed){const {DevelopmentError}=await import('../workflows/development-access.mjs');throw new DevelopmentError(403,'refus');}return{mode:'fixture',connectRoleVerified:false};},
  store:{dashboard:async()=>{reads++;return{iterations:[],portfolio:[]};},get:async()=>{reads++;return{};},proof:async()=>{reads++;return{};}}});
 t.after(async()=>{server.closeAllConnections();await new Promise(r=>server.close(r));});
 const login=await fetch(origin+'/local-developments/session',{method:'POST',headers:{Origin:origin,'Content-Type':'application/json'},body:JSON.stringify({token:bootstrap})});const Cookie=login.headers.get('set-cookie').split(';')[0];
 assert.equal((await fetch(origin+'/local-developments/state',{headers:{Cookie}})).status,200);assert.equal(reads,1);allowed=false;
 for(const route of ['/local-developments/state','/local-developments/iteration?iteration=x','/local-developments/proof?iteration=x&proof=x','/src/private.jsx'])assert.equal((await fetch(origin+route,{headers:{Cookie}})).status,403);
 assert.equal(reads,1);
});
