import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join,resolve,sep} from 'node:path';
import {collectGithubSnapshot,createGithubRefresh,storedGhRequest} from '../workflows/development-github-refresh.mjs';
import {collectGithubInventory,discoverGithubProjects,githubTree,githubPages,githubInventoryView,validateGithubInventoryView} from '../workflows/development-github-inventory.mjs';
import {githubReadRequest} from '../workflows/development-private-publisher.mjs';
import {developmentPortfolio} from '../workflows/development-versions.mjs';

const owner='fixture',repository=owner+'/one',a='a'.repeat(40),b='b'.repeat(40),c='c'.repeat(40),d='d'.repeat(40);
const url=n=>'https://github.com/'+repository+'/pull/'+n;
const prior=()=>({schema:'development-github-observations',observedAt:'2026-11-19T10:00:00Z',applications:{known:{repository,path:'apps/known'}},pullRequests:{},trackedPrUrls:[],untrackedPullRequests:{}});
const row=(type,path,sha=c)=>({type,path,sha});
const tree=extra=>[row('tree','apps'),row('tree','apps/known'),row('blob','apps/known/package.json'),row('blob','apps/known/index.html'),...extra];
function fixture({prCount=101,repositoryName=repository,featureSha=b}={}){
  const repository=repositoryName,url=n=>'https://github.com/'+repository+'/pull/'+n;
  const calls=[];
  const prs=Array.from({length:prCount},(_,i)=>({number:i+1,html_url:url(i+1),title:'Développement '+(i+1),state:i===prCount-1?'open':'closed',draft:i===prCount-1,merged_at:i%2===0?'2026-11-18T10:00:00Z':null,merge_commit_sha:c,updated_at:'2026-11-20T10:00:00Z',head:{sha:featureSha,ref:'feature',repo:{full_name:repository}},base:{sha:a,ref:'stable',repo:{full_name:repository}}}));
  prs.at(-1).merged_at=null;
  const request=async endpoint=>{
    calls.push(endpoint);const u=new URL('https://api.github.com/'+endpoint),page=Number(u.searchParams.get('page')||1);
    if(u.pathname==='/user/repos')return[{full_name:repository,owner:{login:owner}}];
    if(u.pathname==='/users/'+owner+'/repos')return[{full_name:repository,owner:{login:owner}},{full_name:'other/unrelated',owner:{login:'other'}}];
    if(u.pathname==='/repos/'+repository)return{full_name:repository,default_branch:'stable',private:true,archived:false};
    if(u.pathname.endsWith('/branches/stable'))return{commit:{sha:a}};
    if(u.pathname.endsWith('/branches'))return page===1?[{name:'stable',commit:{sha:a}},{name:'feature',commit:{sha:featureSha}}]:[];
    if(u.pathname.endsWith('/git/trees/'+a))return{sha:c,truncated:false,tree:tree([])};
    if(u.pathname.endsWith('/git/trees/'+featureSha))return{sha:d,truncated:false,tree:tree([row('tree','tools'),row('tree','tools/new-agent'),row('blob','tools/new-agent/main.py')])};
    if(u.pathname.endsWith('/pulls'))return prs.slice((page-1)*100,page*100);
    if(u.pathname.endsWith('/pulls/'+prCount))return{...prs.at(-1),changed_files:1};
    if(u.pathname.endsWith('/pulls/'+prCount+'/files'))return[{filename:'tools/new-agent/main.py'}];
    if(u.pathname.endsWith('/actions/runs'))return{workflow_runs:[],total_count:0};
    if(u.pathname.endsWith('/commits'))return[{sha:a}];
    throw Error('Unexpected fixture request '+endpoint);
  };
  return{request,calls};
}

test('reproduction du périmètre initial : le nouveau composant sans inscription est découvert, même hors branche par défaut',async()=>{
  const f=fixture(),before=prior(),copy=structuredClone(before);
  const next=await collectGithubSnapshot(before,{repositories:[repository],discovery:{enabled:true,owner},request:f.request,now:()=> '2026-11-20T10:00:00Z'});
  assert.deepEqual(before,copy);assert.equal(next.inventory.repositories.length,1);
  assert.equal(next.inventory.repositories[0].defaultBranch,'stable');
  assert(next.applications.known);assert.equal(next.applications.known.path,'apps/known');
  const discovered=next.inventory.projects.find(p=>p.path==='tools/new-agent');assert(discovered);
  assert.equal(discovered.inDefaultBranch,false);assert.deepEqual(discovered.branches,['feature']);
  assert.equal(next.applications[discovered.id].mainTree,null);
  assert.equal(next.applications[discovered.id].openPrs[0].number,101);
  const portfolio=await developmentPortfolio([{id:'known',name:'Application existante'}],[],{...next,status:'observed'});
  const card=portfolio.find(p=>p.id===discovered.id);assert(card);assert.equal(card.missingTracking,true);
  assert.deepEqual(card.iterations,[]);assert.equal(card.preproduction,null);assert.equal(card.production,null);
  assert.equal(next.refresh.businessSourcesWritten,false);assert.equal(next.refresh.deployed,false);
});

test('toutes les PR sont parcourues au-delà de cent ; brouillons et fermetures sans fusion restent distincts',async()=>{
  const f=fixture(),next=await collectGithubInventory(prior(),{owner,request:f.request});
  assert.equal(Object.keys(next.pullRequests).length,101);assert.equal(next.pullRequests[url(101)].draft,true);
  assert.equal(next.pullRequests[url(2)].state,'closed');assert.equal(next.pullRequests[url(1)].state,'merged');
  assert(f.calls.some(p=>p.includes('state=all')&&p.endsWith('page=2')));
  const view=githubInventoryView({...next,status:'observed'});assert.equal(view.pullRequests.length,101);assert.equal(view.treeSnapshots,undefined);
});

test('pagination générique : dépôts et branches ne sont pas plafonnés silencieusement à une page',async()=>{
  const calls=[],result=await githubPages(async path=>{calls.push(path);return path.endsWith('page=1')?Array.from({length:100},(_,id)=>({id})): [{id:100}];},'users/fixture/repos?type=owner');
  assert.equal(result.length,101);assert.equal(calls.length,2);
  await assert.rejects(githubPages(async()=>Array(100).fill({}),'/fixture',{maxPages:2}),/Pagination/);
});

test('détection de code et marqueurs, dépendances et modèles exclus, sous-modules non exécutés',()=>{
  const result=discoverGithubProjects([...tree([]),row('tree','automation'),row('blob','automation/server.py'),row('tree','node_modules/fake'),row('blob','node_modules/fake/package.json'),row('tree','templates/model'),row('blob','templates/model/index.html'),row('commit','external',a)],{rootSha:c,registeredPaths:['apps/known']});
  assert(result.projects.some(p=>p.path==='automation'));
  assert(!result.projects.some(p=>p.path.startsWith('node_modules')||p.path.startsWith('templates')));
  assert(result.excludedEntries>=4);assert.equal(result.projects.filter(p=>p.path==='apps/known').length,1);
});

test('arbre récursif tronqué : parcours des sous-arbres, sans annoncer une liste partielle',async()=>{
  const f=async endpoint=>endpoint.includes('?recursive')?{sha:a,truncated:true,tree:[]}:endpoint.endsWith(a)?{sha:a,tree:[row('tree','tool',b)]}:{sha:b,tree:[row('blob','main.py',c)]};
  const result=await githubTree(f,repository,a);assert.deepEqual(result.entries.map(e=>e.path),['tool','tool/main.py']);
  await assert.rejects(githubTree(async()=>({sha:a,truncated:true,tree:[]}),repository,a),/incomplet/);
});

test('arbre immuable déjà inspecté réutilisé et branche déplacée requalifiée',async()=>{
  const f=fixture({prCount:1}),next=await collectGithubInventory(prior(),{owner,request:f.request});
  const g=fixture({prCount:1});await collectGithubInventory(next,{owner,request:g.request});
  assert.equal(g.calls.filter(p=>p.includes('/git/trees/')).length,0);
  const moved=fixture({prCount:1,featureSha:d});await collectGithubInventory(next,{owner,request:moved.request});
  assert.deepEqual(moved.calls.filter(p=>p.includes('/git/trees/')),['repos/'+repository+'/git/trees/'+d+'?recursive=1']);
});

test('échec de pagination ou de périmètre : octets du cache préservés, aucun accord réécrit',async t=>{
  const directory=await mkdtemp(join(tmpdir(),'github-inventory-'));t.after(async()=>{assert(resolve(directory).startsWith(resolve(tmpdir())+sep));await rm(directory,{recursive:true,force:true});});
  const file=join(directory,'github.json');await writeFile(file,JSON.stringify({...prior(),preservedHumanContext:{approvals:['existing']}}));const before=await readFile(file),f=fixture();
  const refresh=createGithubRefresh({file,repositories:[repository],discovery:{enabled:true,owner},minimumIntervalMs:0,request:async p=>{if(p.includes('state=all')&&p.endsWith('page=2'))throw Error('network');return f.request(p);}});
  await assert.rejects(refresh());assert.deepEqual(await readFile(file),before);
  const bad=fixture({prCount:1});await assert.rejects(collectGithubInventory(prior(),{owner,request:p=>p.endsWith('/pulls/1')?{changed_files:2}:bad.request(p)}),/Périmètre/);
});

test('transport dédié : découverte de métadonnées autorisée pour le seul propriétaire et nouveaux dépôts retournés',async()=>{
  const calls=[];const api=githubReadRequest('github_pat_fixture',{repositories:[repository],owner,fetcher:async(url,options)=>{calls.push({url,method:options.method});return{ok:true,text:async()=>url.includes('/user/repos?')?JSON.stringify([{full_name:'fixture/new',owner:{login:owner}},{full_name:'other/private',owner:{login:'other'}}]):'{}'};}});
  await api('user/repos?affiliation=owner&per_page=100&page=1');await api('repos/fixture/new');
  await assert.rejects(api('repos/other/private'));await assert.rejects(api('users/other/repos?type=owner&per_page=100&page=1'));
  await assert.rejects(api('user/repos?affiliation=owner&per_page=100&page=1&other=x'));
  assert(calls.every(c=>c.method==='GET'));
  const cli=storedGhRequest(async()=>({stdout:'[]'}),{owner});assert.deepEqual(await cli('users/fixture/repos?type=owner&per_page=100&page=1'),[]);
});


test('nouveau dépôt du propriétaire découvert sans inscription, ancien périmètre non retrouvé explicite',async()=>{
  const f=fixture({prCount:1,repositoryName:owner+'/new'}),next=await collectGithubInventory(prior(),{owner,request:f.request});
  assert.equal(next.inventory.repositories[0].repository,owner+'/new');
  assert(next.inventory.projects.some(p=>p.repository===owner+'/new'&&p.path==='apps/known'));
  assert.equal(next.applications.known.present,false);assert.equal(next.applications.known.applicationCommit,null);
});

test('projection de l’inventaire : liens altérés, références orphelines et doublons refusés',async()=>{
  const f=fixture({prCount:1}),next=await collectGithubInventory(prior(),{owner,request:f.request});
  const good=githubInventoryView({...next,status:'observed'});
  for(const mutate of [v=>v.projects[0].url='https://example.test/private',v=>v.projects[0].branches=['absent'],v=>v.repositories[0].branches.push(v.repositories[0].branches[0]),v=>v.pullRequests[0].repository='other/private',v=>v.repositories[0].pullRequestUrls.push('https://github.com/fixture/one/pull/999')]){
    const bad=structuredClone(good);mutate(bad);assert.throws(()=>validateGithubInventoryView(bad),/github_inventory_invalid/);
  }
});


test('PR modifiée pendant la lecture des fichiers : aucune affectation de versions mélangées',async()=>{
 const f=fixture({prCount:1});let reads=0;
 await assert.rejects(collectGithubInventory(prior(),{owner,request:async endpoint=>{
  const value=await f.request(endpoint);
  if(endpoint.endsWith('/pulls/1')&&++reads===2)return{...value,head:{...value.head,sha:d}};
  return value;
 }}),/PR modifiée/);
});


test('modules Drupal et outils Python détectés par leur manifeste natif sans README obligatoire',()=>{
 const entries=[row('tree','outil-sans-manifeste'),row('blob','outil-sans-manifeste/README.md'),row('blob','outil-sans-manifeste/engine.py'),row('tree','integrations'),row('tree','integrations/identity'),row('blob','integrations/identity/identity.info.yml'),row('tree','collecte'),row('blob','collecte/requirements.txt'),row('tree','drupal/web/core/modules/system'),row('blob','drupal/web/core/modules/system/system.info.yml'),row('tree','drupal/web/modules/contrib/foreign'),row('blob','drupal/web/modules/contrib/foreign/foreign.info.yml')];
 const result=discoverGithubProjects(entries,{rootSha:c});assert(result.projects.some(p=>p.path==='integrations/identity'&&p.kind==='Intégration'));
 assert(result.projects.some(p=>p.path==='collecte'));assert(result.projects.some(p=>p.path==='outil-sans-manifeste')); assert(!result.projects.some(p=>/core\/modules|modules\/contrib/.test(p.path)));
});
