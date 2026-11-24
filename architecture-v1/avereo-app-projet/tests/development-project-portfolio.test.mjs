import test from 'node:test';
import assert from 'node:assert/strict';
import catalogue from '../data/cockpit-projects.json' with {type:'json'};
import {projectPortfolio,projectIncludesIteration,firstPreproductionReceipt} from '../frontend/src/developments/project-portfolio.mjs';
import {applicationQuality} from '../workflows/development-quality.mjs';
import {projectDevelopmentVersions} from '../workflows/development-versions.mjs';

const at='2026-11-01T10:00:00Z',sha='a'.repeat(40),artifact='b'.repeat(64);
function app(id,extra={}){return{id,name:id,category:'Application',local:{status:'not_configured'},github:{status:'observed',repository:'fixture/products',path:'apps/'+id,url:'https://github.com/fixture/products/tree/'+sha+'/apps/'+id},iterations:[],preproduction:null,production:null,missingTracking:true,...extra};}
function qualified(id,extra={}){
  const data={delivery:{status:'delivered',sourceSha:sha,artifactSha256:artifact,observedAt:at,target:'https://preprod.example.invalid/'+id,evidence:'receipt.json'},checks:[{kind:'preproduction',status:'passed',sourceSha:sha,artifactSha256:artifact,observedAt:at,target:'https://preprod.example.invalid/'+id,evidence:'hosted-check.json'}]};
  return{id:'deployment-'+id,applicationIds:[id],versions:projectDevelopmentVersions(data,{deliveryEnvironment:'preproduction'}),...extra};
}
function freeze(value){if(value&&typeof value==='object'){Object.freeze(value);for(const child of Object.values(value))freeze(child);}return value;}
function baseline(){return catalogue.projects.map(p=>app(p.id,{name:p.name,category:p.category,github:{status:'observed',repository:p.repository,path:p.paths[0],url:'https://github.com/'+p.repository+'/tree/'+sha+'/'+p.paths[0]}}));}

test('les deux sites exposent leurs quatre adresses même sans reçu qualifié, sans changer les versions ni admettre un projet',()=>{
 const apps=baseline(),before=structuredClone(apps),result=projectPortfolio(apps);
 assert.equal(result.main.length,12);
 for(const id of ['site-avereo','tc-longages']){
  const project=result.main.find(p=>p.id===id);assert(project.environmentReferences.preproduction.url.startsWith('https://preprod.'));
  assert(project.environmentReferences.production.url.startsWith('https://'));assert.equal(project.preproduction,null);assert.equal(project.production,null);
  assert.equal(firstPreproductionReceipt(project),null);
 }
 assert.equal(result.main.find(p=>p.id==='rapport').environmentReferences,null);assert.deepEqual(apps,before);
});

test('58 éléments donnent les 12 fiches acceptées et un prototype historique, sans modifier les sources',()=>{
  const apps=[...baseline(),app('rga'),...['prototype-v1','prototype-v1/v1','avereo-v1-base'].map((path,i)=>app('old-'+i,{category:'Prototype',github:{repository:'jpdandin44/AVEREO',path}})),...Array.from({length:42},(_,i)=>app('technical-'+i,{category:'Composant'}))];
  assert.equal(apps.length,58);const original=structuredClone(apps);freeze(apps);
  const result=projectPortfolio(apps);
  assert.deepEqual(result.main.map(p=>p.id),catalogue.projects.map(p=>p.id));
  assert.equal(result.main.length,12);assert.equal(result.history.length,1);assert.equal(result.history[0].projectSources.length,3);
  assert.deepEqual(apps,original);assert.equal(result.main.find(p=>p.id==='vision').preproduction,null);
});

test('RGA est regroupé sous Rapport ; un suivi commun et ses critères ne sont comptés qu’une fois',()=>{
  const summary={id:'shared',currentPhase:2,status:'awaiting_review',unavailable:false};
  const onlyRga={id:'rga-only',currentPhase:1,status:'in_progress'};
  const apps=[app('rapport',{iterations:[summary]}),app('rga',{iterations:[summary,onlyRga]})];
  const iterations=[{...summary,applicationIds:['rapport','rga'],blockerCount:1,quality:{criteria:{total:2,approved:1},proofs:{available:3}}},{...onlyRga,applicationIds:['rga'],blockerCount:2,quality:{criteria:{total:1,approved:0},proofs:{available:1}}}];
  const original=structuredClone({apps,iterations});freeze(apps);freeze(iterations);
  const project=projectPortfolio(apps,iterations).main.find(p=>p.id==='rapport');
  assert.deepEqual(project.iterations.map(i=>i.id),['shared','rga-only']);
  const quality=applicationQuality(project,iterations);assert.equal(quality.criteria.total,3);assert.equal(quality.criteria.approved,1);assert.equal(quality.proofs.available,4);assert.equal(quality.blockers,3);
  assert(projectIncludesIteration(project,iterations[1]));assert.equal(projectIncludesIteration(project,{id:'other',applicationIds:['drone']}),false);
  assert.deepEqual({apps,iterations},original);
});

test('les modules du site et de Rapport restent dans leur fiche et dans les sources détaillées',()=>{
  const apps=[...baseline(),app('module',{category:'Composant',github:{repository:'jpdandin44/avereo-site-drupal',path:'modules/custom/example'}}),app('workflow',{category:'Automatisation',github:{repository:'jpdandin44/AVEREO',path:'architecture-v1/avereo-app-rapport/workflows'}})];
  const result=projectPortfolio(apps);
  assert.equal(result.main.length,12);assert(result.main.find(p=>p.id==='site-avereo').sourceApplicationIds.includes('module'));
  assert(result.main.find(p=>p.id==='rapport').sourceApplicationIds.includes('workflow'));
});

test('une application nouvelle attend son premier passage documenté en préproduction',()=>{
  const candidate=app('new');assert.equal(projectPortfolio([candidate]).main.length,12);
  const iteration=qualified('new');candidate.iterations=[{id:iteration.id}];
  const project=projectPortfolio([candidate],[iteration]).main.at(-1);
  assert.equal(project.id,'new');assert.equal(project.projectAdmission.reason,'documented_preproduction');
  assert.equal(project.projectAdmission.receipt.verification.status,'documented');
});

test('CI verte, phase 2 cochée, déclaration non contrôlée ou livraison de production ne suffisent pas',()=>{
  for(const versions of [
    projectDevelopmentVersions({candidate:{sourceSha:sha},currentPhase:2,checks:[{kind:'ci',status:'passed'}]},{}),
    projectDevelopmentVersions({delivery:{status:'delivered',sourceSha:sha,observedAt:at,target:'preprod',evidence:'receipt'}},{deliveryEnvironment:'preproduction'}),
    projectDevelopmentVersions({delivery:{status:'delivered',sourceSha:sha,observedAt:at,target:'production',evidence:'receipt'}},{deliveryEnvironment:'production'})
  ]){const iteration={id:'pending',applicationIds:['new'],versions},candidate=app('new',{iterations:[{id:'pending'}]});assert.equal(firstPreproductionReceipt(candidate,[iteration]),null);assert.equal(projectPortfolio([candidate],[iteration]).main.length,12);}
});

test('le premier passage historique reste admissible si le dernier lot n’est pas encore qualifié',()=>{
  const old=qualified('new'),later={id:'later',applicationIds:['new'],versions:{declarations:[{environment:'preproduction',observedAt:'2026-11-22',verification:{status:'unqualified'}}]}};
  const candidate=app('new',{iterations:[{id:old.id},{id:later.id}],preproduction:later.versions.declarations[0]});
  assert.equal(firstPreproductionReceipt(candidate,[old,later]).observedAt,at);
  assert.equal(projectPortfolio([candidate],[old,later]).main.at(-1).id,'new');
});

test('un lot commun ne qualifie que les applications explicitement couvertes par son reçu',()=>{
  const iteration=qualified('new',{applicationIds:['new','other']});const candidate=app('new',{iterations:[{id:iteration.id}]});
  assert.equal(firstPreproductionReceipt(candidate,[iteration]),null);
  iteration.versions.declarations[0].applicationIds=['other'];assert.equal(firstPreproductionReceipt(candidate,[iteration]),null);
  iteration.versions.declarations[0].applicationIds=['new'];assert(firstPreproductionReceipt(candidate,[iteration]));
});

test('un reçu incomplet ne devient pas un premier passage par le seul libellé documented',()=>{
  for(const field of ['sourceSha','target','observedAt','evidence']){
    const iteration=qualified('new'),d=iteration.versions.declarations[0];if(field==='sourceSha')delete d.artifactSha256;delete d[field];
    assert.equal(firstPreproductionReceipt(app('new',{iterations:[{id:iteration.id}]}),[iteration]),null,field);
  }
  const iteration=qualified('new');delete iteration.versions.declarations[0].verification.evidence;
  assert.equal(firstPreproductionReceipt(app('new'),[iteration]),null);
});

test('les composants techniques et copies de qualification ne créent pas une fiche même avec un reçu',()=>{
  for(const category of ['Composant','Copie de qualification','Automatisation','Socle commun','Intégration']){
    const iteration=qualified('new'),candidate=app('new',{category,iterations:[{id:iteration.id}]});
    assert.equal(projectPortfolio([candidate],[iteration]).main.length,12,category);
  }
});

test('une nouvelle application admise regroupe ses sous-composants et leurs suivis sans créer plusieurs fiches',()=>{
  const iteration=qualified('new'),candidate=app('new',{iterations:[{id:iteration.id}]}),child=app('child',{category:'Composant',github:{repository:'fixture/products',path:'apps/new/modules/module'},iterations:[{id:'module-work'}]});
  const result=projectPortfolio([child,candidate],[iteration]);assert.equal(result.main.length,13);
  assert.deepEqual(result.main.at(-1).sourceApplicationIds,['new','child']);assert(projectIncludesIteration(result.main.at(-1),{id:'module-work'}));
});

test('un site dans un dépôt autonome nécessite à la fois un marqueur de code et son reçu qualifié',()=>{
  const iteration=qualified('site'),candidate=app('site',{category:'Dépôt',github:{repository:'fixture/site',path:''},iterations:[{id:iteration.id}]});
  assert.equal(projectPortfolio([candidate],[iteration]).main.length,12);
  assert.equal(projectPortfolio([candidate],[iteration],{projects:[{id:'site',markers:['manifeste : composer.json']}]}).main.length,13);
});

test('une observation GitHub absente ne fabrique ni code présent ni version installée pour le catalogue initial',()=>{
  const result=projectPortfolio();assert.equal(result.main.length,12);
  for(const p of result.main){assert.equal(p.github.status,'not_configured');assert.equal(p.preproduction,null);assert.equal(p.production,null);assert.deepEqual(p.iterations,[]);}
});
