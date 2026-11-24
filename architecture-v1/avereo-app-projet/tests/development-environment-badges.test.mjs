import test from 'node:test';
import assert from 'node:assert/strict';
import {environmentBadge,siteObservationBadge} from '../frontend/src/developments/environment-badges.mjs';
import {projectDevelopmentVersions} from '../workflows/development-versions.mjs';
const sourceSha='a'.repeat(40),artifactSha256='b'.repeat(64),observedAt='2026-11-09T10:00:00Z';
const delivery={status:'delivered',sourceSha,artifactSha256,observedAt,target:'https://preprod.example.invalid',evidence:'receipt.json'};
const check={kind:'preproduction',status:'passed',sourceSha,artifactSha256,observedAt,target:delivery.target,evidence:'check.json'};

test('les constats HTTP datés distinguent maintenance, protection et accueil en ligne sans qualifier de livraison',()=>{
 for(const [state,httpStatus,label] of [['maintenance',503,'Maintenance constatée'],['protected',401,'Accès protégé'],['online',200,'En ligne au dernier constat']]){
  const reference={url:'https://site.example.invalid/',observation:{state,httpStatus,observedAt,method:'anonymous_https_get'}},before=structuredClone(reference);
  const badge=siteObservationBadge(reference);assert.equal(badge.label,label);assert.equal(badge.observedAt,observedAt);assert.equal(badge.url,reference.url);
  assert.match(badge.explanation,/sans surveillance continue/);assert.equal(badge.evidence,undefined);assert.deepEqual(reference,before);
  assert.equal(environmentBadge('production',reference).label,'Production déclarée');
 }
});

test('un constat incomplet ou incohérent reste inconnu et les liens avec secrets ou scripts sont refusés',()=>{
 const reference={url:'https://site.example.invalid/',observation:{state:'maintenance',httpStatus:503,observedAt,method:'anonymous_https_get'}};
 for(const observation of [{},{...reference.observation,observedAt:'?'},{...reference.observation,httpStatus:200},{...reference.observation,state:'online'},{...reference.observation,state:'__proto__'},{...reference.observation,state:'constructor'},{...reference.observation,method:'guess'}]){
  const badge=siteObservationBadge({...reference,observation});assert.equal(badge.tone,'gray');assert.equal(badge.observedAt,null);
 }
 for(const url of ['javascript:alert(1)','http://site.example.invalid/','https://user:secret@site.example.invalid/','https://site.example.invalid/?session=secret','https://site.example.invalid/#token'])assert.equal(siteObservationBadge({...reference,url}).url,null);
 assert.equal(siteObservationBadge().label,'État à vérifier');
});
test('vert et bleu exigent une livraison et un contrôle documenté de même version/cible, sans mutation',()=>{
 for(const environment of ['preproduction','production']){
  const raw={delivery,checks:[{...check,kind:environment}]},before=JSON.stringify(raw);
  const value=projectDevelopmentVersions(raw,{deliveryEnvironment:environment}).declarations[0];
  const badge=environmentBadge(environment,value);
  assert.equal(badge.tone,environment==='preproduction'?'green':'blue');assert.equal(badge.shape,'dot');assert.match(badge.explanation,/pas une vérification en temps réel/);
  assert.equal(badge.evidence,'check.json');assert.equal(JSON.stringify(raw),before);
 }
});
test('CI, phase terminée, preuve absente ou autre version/cible ne produisent jamais de vert',()=>{
 for(const altered of [{...check,kind:'ci'},{...check,status:'failed'},{...check,evidence:''},{...check,observedAt:'inconnue'},{...check,sourceSha:'c'.repeat(40)},{...check,artifactSha256:'d'.repeat(64)},{...check,target:'https://other.example.invalid'}]){
  const value=projectDevelopmentVersions({delivery,checks:[altered],currentPhase:3},{deliveryEnvironment:'preproduction'}).declarations[0];
  assert.equal(environmentBadge('preproduction',value).tone,'gray');
 }
 const none=projectDevelopmentVersions({candidate:{sourceSha},checks:[check],phases:[{id:2,status:'complete'}]},{deliveryEnvironment:'preproduction'});
 assert.equal(none.declarations.length,0);assert.equal(environmentBadge('preproduction',null).tone,'gray');
});
test('anciennes projections sans qualification restent grises et sans surveillance inventée',()=>{
 assert.equal(environmentBadge('preproduction',delivery).label,'Préprod déclarée');assert.equal(environmentBadge('production',delivery).label,'Production déclarée');
 for(const value of [null,{...delivery,verification:{status:'documented'}},{...delivery,sourceSha:'invalide',artifactSha256:null,verification:{status:'documented',evidence:'x',observedAt}}])assert.equal(environmentBadge('preproduction',value).tone,'gray');
 assert.equal(environmentBadge('production',null,[{currentPhase:2,status:'complete'}]).tone,'gray');
});
test('triangle orange distingue préparation, examen et accord, sans déduire une autorisation',()=>{
 for(const [status,label] of [['in_progress','Production à préparer'],['awaiting_review','Production à examiner'],['awaiting_approval','Production à autoriser']]){
  const b=environmentBadge('production',null,[{currentPhase:3,status}]);assert.equal(b.tone,'orange');assert.equal(b.shape,'triangle');assert.equal(b.label,label);assert.match(b.explanation,/aucune autorisation/);
 }
 assert.equal(environmentBadge('production',null,[{currentPhase:3,status:'awaiting_review',unavailable:true}]).tone,'gray');
});
test('blocage du suivi ne devient pas une panne d’une production déjà déclarée',()=>{
 const iterations=[{currentPhase:3,status:'blocked'}];assert.equal(environmentBadge('production',null,iterations).tone,'red');
 assert.equal(environmentBadge('production',delivery,iterations).tone,'gray');assert.equal(environmentBadge('preproduction',null,iterations).tone,'gray');
 assert.throws(()=>environmentBadge('public',null));
});
