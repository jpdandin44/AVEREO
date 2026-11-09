import test from 'node:test';
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {createDevelopmentAccess} from '../workflows/development-access.mjs';
const secret='s'.repeat(64),bootstrap='b'.repeat(64),origin='http://127.0.0.1:5196';
const request=(cookie,headers={})=>({headers:{host:'127.0.0.1:5196',...(cookie?{cookie:'avereo_developments_local='+cookie}:{}),...headers},socket:{remoteAddress:'127.0.0.1'}});
const fixture=()=>createDevelopmentAccess({adminId:'101',secret,bootstrap,origin,now:()=>1000000,demo:true});
const signed=changes=>{const data=Buffer.from(JSON.stringify({id:'101',role:'global_admin',provider:'local_private_administrator',iat:1000,exp:2000,sid:'a'.repeat(48),...changes})).toString('base64url');return data+'.'+createHmac('sha256',secret).update(data).digest('base64url');};

test('deux lecteurs privés sur des ports différents conservent leurs sessions distinctes',()=>{
  const a=createDevelopmentAccess({adminId:'101',origin:'http://127.0.0.1:5199',bootstrap,cookieName:'avereo_developments_local_5199'});
  const b=createDevelopmentAccess({adminId:'1',origin:'http://127.0.0.1:5200',bootstrap,cookieName:'avereo_developments_local_5200'});
  const ca=a.login(bootstrap),cb=b.login(bootstrap),cookie=a.cookieName+'='+ca+'; '+b.cookieName+'='+cb;
  const req=port=>({headers:{host:'127.0.0.1:'+port,cookie},socket:{remoteAddress:'127.0.0.1'}});
  assert.equal(a.authenticate(req(5199)).id,'101');assert.equal(b.authenticate(req(5200)).id,'1');
  const wrong=req(5200);wrong.headers.cookie=a.cookieName+'='+ca;assert.throws(()=>b.authenticate(wrong),e=>e.status===401);
  for(const cookieName of ['bad=name','avereo_developments_local;','avereo_developments_local_999999'])assert.throws(()=>createDevelopmentAccess({adminId:'1',origin,cookieName}));
});
test('configuration fermée sans identité unique explicite',()=>{for(const adminId of [null,'','*',101,'0','101,102'])assert.throws(()=>createDevelopmentAccess({adminId,origin}));});
test('seul administrateur local explicitement désigné autorisé',()=>{const access=fixture(),cookie=access.login(bootstrap);assert.equal(access.authenticate(request(cookie)).id,'101');assert.equal(access.authenticate(request(cookie)).demo,true);});
for(const [name,changes] of [['autre administrateur global',{id:'102'}],['administrateur organisation',{role:'admin'}],['membre',{role:'member'}],['lecteur',{role:'viewer'}],['profil non attesté',{provider:'avereo_connect'}]])test(name+' refusé même avec une signature de test valide',()=>assert.throws(()=>fixture().authenticate(request(signed(changes))),e=>e.status===403));
test('anonyme et rôle HTTP inventé refusés',()=>{assert.throws(()=>fixture().authenticate(request(null,{'x-role':'global_admin','x-user-id':'101'})),e=>e.status===401);});
test('signature, encodage, expiration et durée excessive refusés',()=>{for(const token of ['illisible',signed({})+'x',signed({exp:999}),signed({exp:99999}),signed({iat:undefined}),signed({sid:'bad'}),'é'.repeat(64)+'.x'])assert.throws(()=>fixture().authenticate(request(token)));});
test('origine distante, Host et adresses non locales refusés',()=>{const access=fixture(),cookie=access.login(bootstrap);for(const headers of [{origin:'https://tiers.invalid'},{host:'tiers.invalid'},{'sec-fetch-site':'cross-site'}])assert.throws(()=>access.authenticate(request(cookie,headers)),e=>e.status===403);const r=request(cookie);r.socket.remoteAddress='192.0.2.10';assert.throws(()=>access.authenticate(r),e=>e.status===403);});
test('fichier de bootstrap à usage unique sans profil fourni par le client',()=>{const access=fixture();assert.throws(()=>access.login('wrong'),e=>e.status===403);access.login(bootstrap);assert.throws(()=>access.login(bootstrap),e=>e.status===403);});
test('protection CSRF et fermeture effective de session',()=>{const access=fixture(),cookie=access.login(bootstrap),actor=access.authenticate(request(cookie));assert.throws(()=>access.checkCsrf(request(cookie),actor),e=>e.status===403);access.checkCsrf(request(cookie,{'x-development-token':access.csrf(actor)}),actor);access.logout(actor);assert.throws(()=>access.authenticate(request(cookie)),e=>e.status===401);});

test('seule une navigation explicite vers l’entrée locale peut recevoir le sas public sans assouplir le transport privé',()=>{
 const access=fixture(),navigation={...request(null,{'sec-fetch-site':'cross-site','sec-fetch-mode':'navigate','sec-fetch-dest':'document','sec-fetch-user':'?1'}),method:'GET',url:'/?developments'};
 assert.equal(access.isExternalEntryNavigation(navigation),true);assert.throws(()=>access.checkTransport(navigation),e=>e.status===403);
 for(const change of [{method:'POST'},{url:'/local-developments/state'},{url:'/@vite/client'},{headers:{...navigation.headers,origin:'https://tiers.invalid'}},{headers:{...navigation.headers,host:'tiers.invalid'}},{headers:{...navigation.headers,'sec-fetch-dest':'iframe'}},{headers:{...navigation.headers,'sec-fetch-mode':'cors'}},{headers:{...navigation.headers,'sec-fetch-user':undefined}},{socket:{remoteAddress:'192.0.2.10'}}])assert.equal(access.isExternalEntryNavigation({...navigation,...change}),false);
});
