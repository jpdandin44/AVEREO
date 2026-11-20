import {createHash} from 'node:crypto';
import {DevelopmentError} from './development-access.mjs';

const repoName=/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/;
const ownerName=/^[A-Za-z0-9][A-Za-z0-9-]{0,38}$/;
const sha=/^[a-f0-9]{40,64}$/;
const error=message=>{throw new DevelopmentError(502,message);};
const excluded=/^(?:node_modules|vendor|\.git|\.venv|venv|dist|build|coverage|__pycache__|tests?|fixtures?|mocks?|examples?|samples?|templates?)$/i;
const dependencyPath=p=>p.split('/').some(part=>excluded.test(part))||/(?:^|\/)(?:core\/(?:modules|themes|lib|assets|misc|includes)|(?:modules|themes|profiles)\/contrib)(?:\/|$)/i.test(p);
const implementation=/^(?:frontend|backend|public|src|bin|scripts|api|assets|static|config|docs|database|web|modules|themes|lib|include)$/i;
const container=/^(?:architecture-v\d+|apps|applications|packages|services|sites|tools|agents|outillage)$/i;
const manifest=/^(?:package\.json|composer\.json|pyproject\.toml|setup\.py|requirements\.txt|Cargo\.toml|go\.mod|deno\.jsonc?|Gemfile|mix\.exs|[^/]+\.(?:csproj|info\.yml))$/i;
const entryPoint=/^(?:index\.(?:html|php)|main\.py|server\.py|app\.py|collector\.py)$/i;
const code=/\.(?:js|mjs|cjs|jsx|ts|tsx|py|php|html|rs|go|cs)$/i;
const clean=(value,max=600)=>typeof value==='string'?value.replace(/[\x00-\x1f\x7f]/g,' ').slice(0,max):'';
const key=(repository,path)=>createHash('sha256').update(repository.toLowerCase()+'\n'+path).digest('hex').slice(0,24);
const pathValid=p=>typeof p==='string'&&p.length<=1000&&!p.startsWith('/')&&!p.includes('\\')&&!/[\x00-\x1f\x7f]/.test(p)&&p.split('/').every(x=>x&&x!=='.'&&x!=='..');
const encodedPath=path=>path.split('/').map(p=>encodeURIComponent(p).replace(/[!'()*]/g,c=>'%'+c.charCodeAt(0).toString(16).toUpperCase())).join('/');
const compact=p=>({url:p.html_url,repository:p.base.repo.full_name,number:p.number,title:clean(p.title),status:'observed',state:p.merged_at?'merged':p.state,draft:!!p.draft,headSha:p.head.sha,baseSha:p.base.sha,merged:!!p.merged_at,mergedAt:p.merged_at||null,mergeCommitSha:p.merge_commit_sha||null,updatedAt:p.updated_at,headBranch:clean(p.head.ref,255),baseBranch:clean(p.base.ref,255)});

// A bound is a refusal of an incomplete collection, never a successful truncation.
export async function githubPages(request,endpoint,{select=value=>value,maxPages=100,maxItems=10000}={}){
  const result=[];
  for(let page=1;page<=maxPages;page++){
    const response=await request(endpoint+(endpoint.includes('?')?'&':'?')+'per_page=100&page='+page),batch=select(response);
    if(!Array.isArray(batch)||batch.length>100)error('Liste GitHub invalide ; ancienne observation conservée.');
    result.push(...batch);
    if(result.length>maxItems)error('Capacité GitHub dépassée ; aucune liste partielle publiée.');
    if(batch.length<100)return result;
  }
  error('Pagination GitHub incomplète ; ancienne observation conservée.');
}

export async function githubTree(request,repository,commit,{maxEntries=100000,maxTrees=2000}={}){
  const endpoint='repos/'+repository+'/git/trees/';
  const response=await request(endpoint+commit+'?recursive=1');
  if(!sha.test(response?.sha||'')||!Array.isArray(response.tree))error('Arbre GitHub invalide.');
  let entries=response.tree;
  if(response.truncated){
    entries=[];const pending=[{sha:response.sha,prefix:''}];let trees=0;
    while(pending.length){
      if(++trees>maxTrees)error('Arbre GitHub trop grand ; aucune couverture partielle publiée.');
      const item=pending.shift(),part=await request(endpoint+item.sha);
      if(part?.truncated||!Array.isArray(part?.tree)||part.sha!==item.sha)error('Sous-arbre GitHub incomplet.');
      for(const entry of part.tree){
        const path=item.prefix+entry.path;entries.push({...entry,path});
        if(entry.type==='tree')pending.push({sha:entry.sha,prefix:path+'/'});
        if(entries.length>maxEntries)error('Arbre GitHub trop grand ; aucune couverture partielle publiée.');
      }
    }
  }
  if(entries.length>maxEntries||new Set(entries.map(e=>e.path)).size!==entries.length||entries.some(e=>!pathValid(e.path)||!sha.test(e.sha||'')||!['tree','blob','commit'].includes(e.type)))error('Chemins GitHub invalides ou incomplets.');
  return{sha:response.sha,entries};
}

export function discoverGithubProjects(entries,{rootSha,registeredPaths=[]}={}){
  const trees=new Map(entries.filter(e=>e.type==='tree').map(e=>[e.path,e.sha]));
  const blobs=entries.filter(e=>e.type==='blob'),roots=new Map([['',{path:'',kind:'Dépôt',markers:[]}]]);
  let excludedEntries=0;
  const add=(path,marker,structural=false)=>{
    if(path&&dependencyPath(path))return;
    if(path&&implementation.test(path.split('/').at(-1))&&!registeredPaths.includes(path))return;
    const parts=path.split('/'),base=parts.at(-1);
    const kind=parts.some(p=>/^candidate(?:-|$)/.test(p))||/config\/.*\/source\//.test(path)?'Copie de qualification':parts.some(p=>/^prototypes?(?:-|$)/.test(p))?'Prototype':parts.includes('integrations')?'Intégration':parts.includes('workflows')?'Automatisation':/^avereo-app-/.test(base)?'Application':base==='avereo-platform'?'Socle commun':/agents?\//i.test(path)?'Agent ou outil':'Composant';
    const previous=roots.get(path)||{path,kind,markers:[],structural};
    if(marker&&!previous.markers.includes(marker))previous.markers.push(marker);
    roots.set(path,previous);
  };
  for(const entry of entries){
    const parts=entry.path.split('/');
    if(dependencyPath(entry.path)){excludedEntries++;continue;}
    for(let n=0;n<parts.length-1;n++)if(container.test(parts[n]))add(parts.slice(0,n+2).join('/'),'répertoire de composants',true);
    if(entry.type!=='blob')continue;
    const file=parts.at(-1),parent=parts.slice(0,-1).join('/');
    if(manifest.test(file))add(parent,'manifeste : '+file);
    if(entryPoint.test(file))add(parent,'point d’entrée : '+file);
    if(/^readme\.md$/i.test(file)&&blobs.some(b=>b.path.startsWith(parent?parent+'/':'')&&code.test(b.path)&&!dependencyPath(b.path)))add(parent,'README et code');
  }
  for(const path of registeredPaths)if(!path||trees.has(path))add(path,'périmètre déjà rattaché');
  const projects=[...roots.values()].filter(p=>!p.path||p.structural||registeredPaths.includes(p.path)||![...roots.keys()].some(parent=>parent&&p.path.startsWith(parent+'/')&&implementation.test(p.path.slice(parent.length+1).split('/')[0]))).map(p=>({
    path:p.path,kind:p.kind,name:p.path?p.path.split('/').at(-1).replace(/^avereo-app-/,'').replace(/^avereo-/,'AVEREO ').replaceAll('-',' '):'Racine du dépôt',
    treeSha:p.path?trees.get(p.path):rootSha,markers:p.markers,
    historical:/^(?:archives?|legacy|old)$/i.test(p.path.split('/')[0])||p.path.split('/').some(x=>/^_?archives?(?:_|-)/i.test(x))
  })).filter(p=>sha.test(p.treeSha||''));
  return{projects,excludedEntries};
}

export async function collectGithubInventory(previous,{owner,request,trackedPrUrls,now=()=>new Date().toISOString()}={}){
  if(previous?.schema!=='development-github-observations'||!ownerName.test(owner||'')||typeof request!=='function')throw new DevelopmentError(503,'Découverte GitHub non configurée.');
  const startedAt=now(),observedRepositories=new Map();
  for(const endpoint of ['user/repos?affiliation=owner','users/'+owner+'/repos?type=owner']){
    for(const repository of await githubPages(request,endpoint,{maxItems:1000})){
      if(repository.owner?.login?.toLowerCase()!==owner.toLowerCase())continue;
      if(!repoName.test(repository.full_name||'')||repository.full_name.split('/')[0].toLowerCase()!==owner.toLowerCase())error('Propriétaire du dépôt GitHub invalide.');
      observedRepositories.set(repository.full_name.toLowerCase(),repository);
    }
  }
  if(!observedRepositories.size)error('Aucun dépôt GitHub visible ; ancienne observation conservée.');
  const registered=Object.entries(previous.applications||{}),repositories={},applications={},pullRequests={},latestMerges={},treeSnapshots={},repoInventory=[],projects=[];
  const oldTrees=previous.inventory?.detectorVersion===3?previous.inventory.treeSnapshots||{}:{};
  for(const summary of [...observedRepositories.values()].sort((a,b)=>a.full_name.localeCompare(b.full_name))){
    const repository=summary.full_name,metadata=await request('repos/'+repository);
    if(metadata.full_name?.toLowerCase()!==repository.toLowerCase()||typeof metadata.default_branch!=='string'||!metadata.default_branch||/[\x00-\x1f]/.test(metadata.default_branch))error('Métadonnées GitHub incomplètes.');
    if(metadata.size===0&&metadata.pushed_at===null){repoInventory.push({repository,url:'https://github.com/'+repository,visibility:metadata.private?'private':'public',archived:!!metadata.archived,defaultBranch:metadata.default_branch,headSha:null,empty:true,branches:[],pullRequestUrls:[]});repositories[repository]={mainSha:null,branch:metadata.default_branch};continue;}
    const branch=await request('repos/'+repository+'/branches/'+encodeURIComponent(metadata.default_branch));
    if(!sha.test(branch.commit?.sha||''))error('Branche par défaut absente.');
    const head=branch.commit.sha,branches=await githubPages(request,'repos/'+repository+'/branches');
    if(new Set(branches.map(b=>b.name)).size!==branches.length||branches.some(b=>typeof b.name!=='string'||!b.name||!sha.test(b.commit?.sha||'')))error('Liste de branches GitHub invalide.');
    if(!branches.some(b=>b.name===metadata.default_branch&&b.commit.sha===head))error('Branche par défaut modifiée pendant le relevé.');
    const prs=await githubPages(request,'repos/'+repository+'/pulls?state=all&sort=created&direction=asc');
    if(new Set(prs.map(p=>p.number)).size!==prs.length)error('Pagination de PR instable.');
    const changed=new Map();
    for(const p of prs){
      if(!Number.isInteger(p.number)||p.number<1||p.base?.repo?.full_name?.toLowerCase()!==repository.toLowerCase()||p.html_url!=='https://github.com/'+repository+'/pull/'+p.number||!sha.test(p.head?.sha||'')||!sha.test(p.base?.sha||''))error('PR GitHub invalide.');
      pullRequests[p.html_url]=compact(p);
      if(p.state!=='open')continue;
      const detail=await request('repos/'+repository+'/pulls/'+p.number),files=await githubPages(request,'repos/'+repository+'/pulls/'+p.number+'/files',{maxPages:31,maxItems:3000});
      if(!Number.isInteger(detail.changed_files)||detail.changed_files!==files.length)error('Périmètre de PR incomplet ; aucune affectation supposée.');
      const after=await request('repos/'+repository+'/pulls/'+p.number);
      if([detail,after].some(d=>d.head?.sha!==p.head.sha||d.base?.sha!==p.base.sha||d.state!=='open'))error('PR modifiée pendant le relevé ; ancienne observation conservée.');
      const paths=files.flatMap(f=>[f.filename,...(f.previous_filename?[f.previous_filename]:[])]);
      if(paths.some(path=>!pathValid(path)))error('Chemin de PR invalide.');changed.set(p.html_url,paths);
      const runs=await githubPages(request,'repos/'+repository+'/actions/runs?head_sha='+p.head.sha,{select:r=>r.workflow_runs,maxPages:10,maxItems:1000}),latest=new Map();
      for(const w of runs){const id=w.path+'|'+w.event;if(!latest.has(id)||latest.get(id).run_number<w.run_number)latest.set(id,w);}
      pullRequests[p.html_url].checks=[...latest.values()].map(w=>({name:clean(w.name),event:w.event,status:w.status,conclusion:w.conclusion,url:w.html_url}));
    }
    repositories[repository]={mainSha:head,branch:metadata.default_branch};
    latestMerges[repository]={coverage:'Toutes les PR parcourues ; dix dernières fusions affichées dans ce résumé',items:prs.filter(p=>p.merged_at).sort((a,b)=>Date.parse(b.merged_at)-Date.parse(a.merged_at)).slice(0,10).map(p=>({number:p.number,title:clean(p.title),url:p.html_url,mergedAt:p.merged_at,mergeCommitSha:p.merge_commit_sha}))};
    const registeredPaths=registered.filter(([,a])=>a.repository?.toLowerCase()===repository.toLowerCase()).map(([,a])=>a.path);
    const scopes=new Map();
    for(const b of branches){
      const cacheKey=repository.toLowerCase()+':'+b.commit.sha;
      let tree=treeSnapshots[cacheKey]||oldTrees[cacheKey];
      if(!tree){const read=await githubTree(request,repository,b.commit.sha),found=discoverGithubProjects(read.entries,{rootSha:read.sha});tree={rootSha:read.sha,entries:read.entries.length,projects:found.projects,directories:Object.fromEntries(read.entries.filter(e=>e.type==='tree').map(e=>[e.path,e.sha])),excludedEntries:found.excludedEntries};}
      treeSnapshots[cacheKey]=tree;
      const branchProjects=[...tree.projects];
      for(const path of registeredPaths)if(path&&tree.directories[path]&&!branchProjects.some(p=>p.path===path))branchProjects.push({path,treeSha:tree.directories[path],name:path.split('/').at(-1).replaceAll('-',' '),kind:'Composant',markers:['périmètre déjà rattaché'],historical:false});
      for(const p of branchProjects){
        let current=scopes.get(p.path);
        if(!current){current={...structuredClone(p),repository,branches:[],inDefaultBranch:false,headSha:b.commit.sha};scopes.set(p.path,current);}
        current.branches.push(b.name);
        if(b.name===metadata.default_branch)Object.assign(current,{...structuredClone(p),inDefaultBranch:true,headSha:head});
      }
    }
    for(const p of scopes.values()){
      const known=registered.find(([,a])=>a.repository?.toLowerCase()===repository.toLowerCase()&&a.path===p.path);
      const id=known?.[0]||'github-'+key(repository,p.path);
      const relevant=prs.filter(pr=>pr.state==='open'&&(!p.path||changed.get(pr.html_url)?.some(f=>f===p.path||f.startsWith(p.path+'/'))));
      const url='https://github.com/'+repository+'/tree/'+p.headSha+(p.path?'/'+encodedPath(p.path):'');
      let applicationCommit=p.headSha;
      if(p.inDefaultBranch&&p.path){const commits=await request('repos/'+repository+'/commits?sha='+head+'&path='+encodeURIComponent(p.path)+'&per_page=1');applicationCommit=commits[0]?.sha;if(!sha.test(applicationCommit||''))error('Commit applicatif absent.');}
      applications[id]={repository,path:p.path,mainSha:head,mainTree:p.inDefaultBranch?p.treeSha:null,applicationCommit,url,defaultBranch:metadata.default_branch,inDefaultBranch:p.inDefaultBranch,present:true,name:p.name,category:p.kind,openPrs:relevant.map(pr=>({number:pr.number,url:pr.html_url,draft:!!pr.draft,policyStatus:pullRequests[pr.html_url].checks?.find(c=>c.name==='PR Policy')?.conclusion||null}))};
      const project={id,...p,name:p.path?p.name:repository.split('/')[1]+' — racine du dépôt',url};projects.push(project);
      if(projects.length>5000)error('Capacité de composants GitHub dépassée ; aucune liste partielle publiée.');
    }
    repoInventory.push({repository,url:'https://github.com/'+repository,visibility:metadata.private?'private':'public',archived:!!metadata.archived,defaultBranch:metadata.default_branch,headSha:head,empty:false,branches:branches.map(b=>({name:clean(b.name,255),headSha:b.commit.sha,url:'https://github.com/'+repository+'/tree/'+b.commit.sha,isDefault:b.name===metadata.default_branch,openPrs:prs.filter(p=>p.state==='open'&&p.head?.ref===b.name&&p.head?.repo?.full_name===repository).map(p=>p.html_url)})),pullRequestUrls:prs.map(p=>p.html_url)});
  }
  for(const [id,old] of registered)if(!applications[id])applications[id]={repository:old.repository,path:old.path,present:false,inDefaultBranch:false,mainSha:repositories[old.repository]?.mainSha||null,mainTree:null,applicationCommit:null,url:'https://github.com/'+old.repository,openPrs:[]};
  for(const url of new Set(trackedPrUrls||previous.trackedPrUrls||Object.keys(previous.pullRequests||{}))){
    const m=url.match(/^https:\/\/github\.com\/([^/]+\/[^/]+)\/pull\/([1-9][0-9]*)$/);
    if(!m||!observedRepositories.has(m[1].toLowerCase()))throw new DevelopmentError(503,'PR suivie hors du compte accessible.');
    if(!pullRequests[url]){const p=await request('repos/'+m[1]+'/pulls/'+m[2]);pullRequests[url]=compact(p);}
  }
  for(const [repository,r] of Object.entries(repositories))if(r.mainSha){const current=await request('repos/'+repository+'/branches/'+encodeURIComponent(r.branch));if(current.commit?.sha!==r.mainSha)throw new DevelopmentError(409,'Branche par défaut modifiée pendant la collecte ; ancienne observation conservée.');}
  const observedAt=now();for(const p of Object.values(pullRequests))p.observedAt=observedAt;
  const untrackedPullRequests=structuredClone(previous.untrackedPullRequests||{});
  for(const item of Object.values(untrackedPullRequests))if(pullRequests[item.github?.url]){item.github=pullRequests[item.github.url];item.observedAt=observedAt;}
  const next={...previous,observedAt,method:'owner_inventory_read_only_github_get',repositories,applications,pullRequests,latestMerges,untrackedPullRequests,
    inventory:{schema:'avereo-github-inventory',version:1,detectorVersion:3,owner,observedAt,coverage:'public_and_accessible_private_repositories_all_returned_pages',repositories:repoInventory,projects,treeSnapshots,limitations:['Les dépôts privés non autorisés par les accès existants sont invisibles.','Les développements restés sur le PC ne sont pas présents sur GitHub.','La découverte de composants par chemins et marqueurs ne prouve ni leur installation ni leur recette.','Les dépendances, fichiers générés, tests et modèles sont exclus de la détection de composants.','Les branches présentes peuvent être historiques ; aucune activité ni phase humaine n’en est déduite.']},
    trackedPrUrls:[...new Set(trackedPrUrls||previous.trackedPrUrls||[])],
    refresh:{mode:'explicit_owner_request',startedAt,completedAt:observedAt,businessSourcesWritten:false,codePulled:false,deployed:false}};
  githubInventoryView({...next,status:'observed'});
  return next;
}

export function githubInventoryView(github){
  if(github?.status!=='observed'||!github.inventory)return null;
  const {treeSnapshots,detectorVersion,...inventory}=github.inventory;
  return validateGithubInventoryView({...inventory,pullRequests:Object.values(github.pullRequests||{}).filter(p=>inventory.repositories.some(r=>r.repository===p.repository))});
}

export function validateGithubInventoryView(value){
  const list=(v,max)=>Array.isArray(v)&&v.length<=max;
  const text=(v,max=600)=>typeof v==='string'&&v.length<=max&&!/[\x00-\x1f\x7f]/.test(v);
  const id=v=>typeof v==='string'&&/^[a-z0-9_-]{1,100}$/.test(v);
  const check=valid=>{if(!valid)throw Error('github_inventory_invalid');};
  check(value?.schema==='avereo-github-inventory'&&value.version===1&&ownerName.test(value.owner||'')&&Number.isFinite(Date.parse(value.observedAt))&&value.coverage==='public_and_accessible_private_repositories_all_returned_pages');
  check(list(value.repositories,1000)&&list(value.projects,5000)&&list(value.pullRequests,10000)&&list(value.limitations,30)&&value.limitations.every(v=>text(v)));
  const repos=new Set(),prs=new Map(),projects=new Set(),branchNames=new Map();
  for(const r of value.repositories){
    check(repoName.test(r.repository||'')&&r.repository.split('/')[0].toLowerCase()===value.owner.toLowerCase()&&!repos.has(r.repository)&&r.url==='https://github.com/'+r.repository&&['private','public'].includes(r.visibility)&&typeof r.archived==='boolean'&&text(r.defaultBranch,255)&&r.defaultBranch.length>0&&typeof r.empty==='boolean'&&(r.empty?r.headSha===null:sha.test(r.headSha||''))&&list(r.branches,10000)&&list(r.pullRequestUrls,10000));repos.add(r.repository);
    const names=new Set();for(const b of r.branches){check(text(b.name,255)&&b.name.length>0&&!names.has(b.name)&&sha.test(b.headSha||'')&&b.url==='https://github.com/'+r.repository+'/tree/'+b.headSha&&typeof b.isDefault==='boolean'&&list(b.openPrs,10000));names.add(b.name);}
    branchNames.set(r.repository,names);
    check(r.empty?r.branches.length===0:r.branches.some(b=>b.isDefault&&b.name===r.defaultBranch&&b.headSha===r.headSha)&&r.branches.filter(b=>b.isDefault).length===1);
  }
  for(const p of value.pullRequests){check(repos.has(p.repository)&&Number.isSafeInteger(p.number)&&p.number>0&&p.url==='https://github.com/'+p.repository+'/pull/'+p.number&&!prs.has(p.url)&&text(p.title)&&['open','closed','merged'].includes(p.state)&&typeof p.draft==='boolean'&&sha.test(p.headSha||'')&&sha.test(p.baseSha||''));prs.set(p.url,p);}
  for(const r of value.repositories){for(const url of r.pullRequestUrls)check(prs.get(url)?.repository===r.repository);for(const b of r.branches)for(const url of b.openPrs)check(prs.get(url)?.repository===r.repository);}
  for(const p of value.projects){
    check(id(p.id)&&!projects.has(p.id)&&repos.has(p.repository)&&(p.path===''||pathValid(p.path))&&text(p.name)&&text(p.kind)&&typeof p.inDefaultBranch==='boolean'&&typeof p.historical==='boolean'&&sha.test(p.headSha||'')&&sha.test(p.treeSha||'')&&p.url==='https://github.com/'+p.repository+'/tree/'+p.headSha+(p.path?'/'+encodedPath(p.path):'')&&list(p.branches,10000)&&p.branches.length>0&&new Set(p.branches).size===p.branches.length&&p.branches.every(v=>text(v,255)&&branchNames.get(p.repository).has(v))&&list(p.markers,30)&&p.markers.every(v=>text(v)));projects.add(p.id);
  }
  return value;
}
