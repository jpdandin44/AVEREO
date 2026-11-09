import {readFile,open,rename,unlink} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {DevelopmentError} from './development-access.mjs';
const exec=promisify(execFile),repoPattern=/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/,shaPattern=/^[a-f0-9]{40,64}$/;
export function storedGhRequest(executor=exec){return async path=>{
 if(!/^repos\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\//.test(path)||path.includes('..')||/[\r\n]/.test(path))throw Error('Endpoint refusé.');
 const env={...process.env,GH_HOST:'github.com',GH_PROMPT_DISABLED:'1'};delete env.GH_TOKEN;delete env.GITHUB_TOKEN;
 try{const r=await executor('gh',['api','--hostname','github.com','--method','GET',path,'-H','Accept: application/vnd.github+json'],{env,windowsHide:true,timeout:20000,maxBuffer:8*1024*1024});return JSON.parse(r.stdout);}catch{throw new DevelopmentError(502,'Lecture GitHub impossible. Vérifier la connexion GitHub CLI du poste ; l’ancienne observation est conservée.');}
};}
const compact=p=>({url:p.html_url,repository:p.base.repo.full_name,number:p.number,title:p.title,status:'observed',state:p.merged_at?'merged':p.state,draft:p.draft,headSha:p.head.sha,baseSha:p.base.sha,merged:!!p.merged_at,mergedAt:p.merged_at,mergeCommitSha:p.merge_commit_sha,updatedAt:p.updated_at});
export async function collectGithubSnapshot(previous,{repositories,request,trackedPrUrls=null,now=()=>new Date().toISOString()}){
 if(previous.schema!=='development-github-observations'||!previous.applications||!Array.isArray(repositories)||!repositories.length||repositories.some(r=>!repoPattern.test(r)))throw new DevelopmentError(503,'Configuration GitHub privée invalide.');
 const allowed=new Set(repositories),apps=Object.entries(previous.applications);
 if(apps.some(([id,a])=>!/^[a-z0-9_-]{1,80}$/.test(id)||!allowed.has(a.repository)||typeof a.path!=='string'||a.path.split('/').some(x=>x==='..')||a.path.startsWith('/')))throw new DevelopmentError(503,'Périmètres GitHub non qualifiés.');
 const pullRequests={},main={},trees={},openPrs={},latestMerges={},startedAt=now();
 for(const repository of repositories){
  const branch=await request('repos/'+repository+'/branches/main');if(!shaPattern.test(branch.commit?.sha||''))throw Error('Main absent.');main[repository]=branch.commit.sha;
  const tree=await request('repos/'+repository+'/git/trees/'+branch.commit.sha+'?recursive=1');if(tree.truncated||!Array.isArray(tree.tree))throw new DevelopmentError(502,'Arbre GitHub incomplet ; observation précédente conservée.');trees[repository]={root:tree.sha,entries:new Map(tree.tree.filter(x=>x.type==='tree').map(x=>[x.path,x.sha]))};
  const opened=await request('repos/'+repository+'/pulls?state=open&per_page=100');if(!Array.isArray(opened)||opened.length>=100)throw new DevelopmentError(502,'Liste de PR trop grande pour ce collecteur borné.');
  const closed=await request('repos/'+repository+'/pulls?state=closed&sort=updated&direction=desc&per_page=30');if(!Array.isArray(closed))throw Error('Historique absent.');
  openPrs[repository]=opened;for(const p of [...closed,...opened])pullRequests[p.html_url]=compact(p);
  latestMerges[repository]={coverage:'30 dernières PR fermées examinées ; liste non exhaustive',items:closed.filter(p=>p.merged_at).sort((a,b)=>Date.parse(b.merged_at)-Date.parse(a.merged_at)).slice(0,10).map(p=>({number:p.number,title:p.title,url:p.html_url,mergedAt:p.merged_at,mergeCommitSha:p.merge_commit_sha}))};
 }
 for(const url of new Set(trackedPrUrls||previous.trackedPrUrls||Object.keys(previous.pullRequests||{}))){const m=url.match(/^https:\/\/github\.com\/([^/]+\/[^/]+)\/pull\/([1-9][0-9]*)$/);if(!m||!allowed.has(m[1]))throw new DevelopmentError(503,'Référence de PR hors périmètre.');if(!pullRequests[url])pullRequests[url]=compact(await request('repos/'+m[1]+'/pulls/'+m[2]));}
 const changedFiles=new Map();
 for(const [repository,prs]of Object.entries(openPrs))for(const p of prs){const runs=await request('repos/'+repository+'/actions/runs?head_sha='+p.head.sha+'&per_page=100'),last=new Map();for(const w of runs.workflow_runs||[]){const key=w.path+'|'+w.event;if(!last.has(key)||last.get(key).run_number<w.run_number)last.set(key,w);}pullRequests[p.html_url].checks=[...last.values()].map(w=>({name:w.name,event:w.event,status:w.status,conclusion:w.conclusion,url:w.html_url}));
  if(apps.some(([,a])=>a.repository===repository&&a.path)){const files=[];let complete=false;for(let page=1;page<=10;page++){const batch=await request('repos/'+repository+'/pulls/'+p.number+'/files?per_page=100&page='+page);if(!Array.isArray(batch))throw Error('Périmètre de PR absent.');files.push(...batch.map(x=>x.filename));if(batch.length<100){complete=true;break;}}if(!complete)throw new DevelopmentError(502,'Périmètre de PR tronqué ; observation précédente conservée.');changedFiles.set(p.html_url,files);}
 }
 const applications={};for(const [id,a]of apps){const tree=trees[a.repository],mainTree=a.path?tree.entries.get(a.path):tree.root;if(!mainTree)throw new DevelopmentError(502,'Périmètre applicatif absent de main.');let commit=main[a.repository];if(a.path){const rows=await request('repos/'+a.repository+'/commits?sha='+main[a.repository]+'&path='+encodeURIComponent(a.path)+'&per_page=1');commit=rows[0]?.sha;if(!shaPattern.test(commit||''))throw Error('Commit applicatif absent.');}
 const relevant=openPrs[a.repository].filter(p=>!a.path||changedFiles.get(p.html_url)?.some(f=>f===a.path||f.startsWith(a.path+'/')));applications[id]={repository:a.repository,path:a.path,mainSha:main[a.repository],mainTree,applicationCommit:commit,url:'https://github.com/'+a.repository+'/tree/'+main[a.repository]+(a.path?'/'+a.path:''),openPrs:relevant.map(p=>({number:p.number,url:p.html_url,draft:p.draft,policyStatus:pullRequests[p.html_url].checks?.find(c=>c.name==='PR Policy')?.conclusion||null}))};}
 for(const repository of repositories){const check=await request('repos/'+repository+'/branches/main');if(check.commit.sha!==main[repository])throw new DevelopmentError(409,'Main a changé pendant la collecte ; actualiser à nouveau. Ancienne observation conservée.');}
 const observedAt=now();for(const p of Object.values(pullRequests))p.observedAt=observedAt;
 const untrackedPullRequests=structuredClone(previous.untrackedPullRequests||{});for(const item of Object.values(untrackedPullRequests))if(pullRequests[item.github?.url]){item.github=pullRequests[item.github.url];item.observedAt=observedAt;}
 return{...previous,observedAt,trackedPrUrls:[...new Set(trackedPrUrls||previous.trackedPrUrls||Object.keys(previous.pullRequests||{}))],method:'manual_read_only_github_get',repositories:Object.fromEntries(repositories.map(r=>[r,{mainSha:main[r],branch:'main'}])),applications,pullRequests,latestMerges,untrackedPullRequests,refresh:{mode:'explicit_owner_request',startedAt,completedAt:observedAt,businessSourcesWritten:false,codePulled:false,deployed:false}};
}
export function createGithubRefresh({file,repositories,request=storedGhRequest(),minimumIntervalMs=30000,getTrackedPrUrls=null,now=()=>new Date().toISOString()}){
 return async()=>{let lock,temporary;try{try{lock=await open(file+'.refresh.lock','wx',0o600);}catch{throw new DevelopmentError(409,'Une actualisation GitHub est déjà en cours.');}
 const old=await readFile(file),previous=JSON.parse(old);if(Date.parse(now())-Date.parse(previous.observedAt)<minimumIntervalMs)throw new DevelopmentError(429,'Observation récente ; patienter avant une nouvelle collecte.');
 const trackedPrUrls=getTrackedPrUrls?await getTrackedPrUrls():null;
 const next=await collectGithubSnapshot(previous,{repositories,request,trackedPrUrls,now});temporary=file+'.'+randomUUID()+'.tmp';const out=await open(temporary,'wx',0o600);try{await out.writeFile(JSON.stringify(next,null,2)+'\n');await out.sync();}finally{await out.close();}
 if(!(await readFile(file)).equals(old))throw new DevelopmentError(409,'Observation modifiée en parallèle ; aucun écrasement.');await rename(temporary,file);temporary=null;return{observedAt:next.observedAt,repositories:repositories.length,pullRequests:Object.keys(next.pullRequests).length,mergedPullRequests:Object.values(next.latestMerges).reduce((n,r)=>n+r.items.length,0)};
 }catch(e){if(e instanceof DevelopmentError)throw e;throw new DevelopmentError(502,'Collecte incomplète ; observation précédente conservée.');}finally{if(temporary)await unlink(temporary).catch(()=>{});if(lock){await lock.close();await unlink(file+'.refresh.lock').catch(()=>{});}}};
}
