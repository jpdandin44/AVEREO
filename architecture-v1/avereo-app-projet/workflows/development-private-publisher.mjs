import {readFile,open,rename,unlink,lstat,realpath,mkdir,readdir} from 'node:fs/promises';
import {resolve,relative,join,isAbsolute} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {collectGithubSnapshot} from './development-github-refresh.mjs';
import {exportDevelopmentSnapshot} from './development-snapshot-export.mjs';
import {openDevelopmentSnapshotStore,sealDevelopmentSnapshot} from './development-snapshot-store.mjs';
import {signPublisherStatus,readPublisherStatus} from './development-publisher-status.mjs';
import {developmentPortfolio} from './development-versions.mjs';
const hash=b=>createHash('sha256').update(b).digest('hex');
const within=(root,file)=>{const p=relative(root,file);return !!p&&!p.startsWith('..')&&!isAbsolute(p);};
async function privatePath(file,root,{directory=false,limit=32*1024*1024}={}){
 const p=resolve(file),s=await lstat(p);if(!within(root,p)||s.isSymbolicLink()||await realpath(p)!==p||(directory?!s.isDirectory():!s.isFile())||!directory&&s.size>limit)throw Error('private_path_refused');
 if(process.platform!=='win32'&&((s.mode&0o077)!==0||typeof process.geteuid==='function'&&s.uid!==process.geteuid()))throw Error('private_permissions_refused');return p;
}
async function atomic(file,bytes){const temp=file+'.'+randomUUID()+'.tmp';let created=false;try{const f=await open(temp,'wx',0o600);created=true;try{await f.writeFile(bytes);await f.sync();}finally{await f.close();}await rename(temp,file);created=false;}finally{if(created)await unlink(temp).catch(()=>{});}}
export function githubReadRequest(token,{repositories,fetcher=fetch,onExpiry=()=>{}}={}){
 if(typeof token!=='string'||!/^github_pat_[A-Za-z0-9_]+$/.test(token)||!Array.isArray(repositories)||!repositories.length)throw Error('dedicated_read_token_required');
 const allowed=new Set(repositories);
 return async endpoint=>{
  const m=endpoint.match(/^repos\/([A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+)\//);if(!m||!allowed.has(m[1])||endpoint.includes('..')||/[\r\n#\\]/.test(endpoint))throw Error('github_endpoint_refused');
  const url=new URL('https://api.github.com/'+endpoint);if(!url.pathname.startsWith('/repos/'+m[1]+'/'))throw Error('github_endpoint_refused');
  const r=await fetcher(url.href,{method:'GET',redirect:'error',signal:AbortSignal.timeout(20000),headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','User-Agent':'AVEREO-private-cockpit','X-GitHub-Api-Version':'2022-11-28'}});
  if(!r.ok)throw Error('github_read_failed');const expiry=r.headers?.get('GitHub-Authentication-Token-Expiration');if(expiry&&Number.isFinite(Date.parse(expiry)))onExpiry(new Date(expiry).toISOString());const text=await r.text();if(Buffer.byteLength(text)>8*1024*1024)throw Error('github_response_too_large');return JSON.parse(text);
 };
}
export function semanticSnapshot(data){
 const walk=(v,keys=[])=>Array.isArray(v)?v.map(x=>walk(x,keys)):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).filter(([k])=>!['readAt','readWindow','generatedAt','sequence','sourceModifiedAt','githubObservedAt'].includes(k)&&!(k==='observedAt'&&keys.some(p=>/github|local/i.test(p)))).map(([k,x])=>[k,walk(x,[...keys,k])])):v;
 return hash(JSON.stringify(walk(data)));
}
export function retainPublishedHistory(next,previous){
 for(let n=0;n<next.iterations.length;n++){
  const current=next.iterations[n],old=previous.iterations.find(v=>v.id===current.id);
  if(old&&old.sourceHash===current.sourceHash&&old.iterationId===current.iterationId&&old.dataPath===current.dataPath)next.iterations[n]={...structuredClone(old),githubObservation:current.githubObservation};
 }
 const ids=new Set(next.iterations.map(v=>v.id));for(const old of previous.iterations)if(!ids.has(old.id))next.iterations.push(structuredClone(old));
 for(const p of previous.proofs){const view=next.iterations.find(v=>v.id===p.iterationId),refs=view?.phases.flatMap(x=>x.proofs).concat(view.unassignedProofs||[])||[];
  if(refs.some(r=>r.id===p.proofId&&r.fileHash===p.sha256)&&!next.proofs.some(q=>q.iterationId===p.iterationId&&q.proofId===p.proofId)){
   next.proofs.push(structuredClone(p));const r=refs.find(r=>r.id===p.proofId);r.availability='available';
  }
 }
 // A hosted source mirror is not a new inspection of the owner's Windows clones.
 for(const row of next.portfolio){const old=previous.portfolio.find(x=>x.id===row.id);if(old?.local)row.local=old.local;if(old?.localReference)row.localReference=old.localReference;
  for(const item of old?.iterations||[])if(!ids.has(item.id)&&!row.iterations.some(v=>v.id===item.id))row.iterations.push(structuredClone(item));
 }
 for(const key of ['reference','localReference'])if(previous[key])next[key]=previous[key];
 return next;
}
export async function runPrivatePublisher(config,{requestGithub,exportSnapshot=exportDevelopmentSnapshot,now=()=>new Date().toISOString()}={}){
 if(config?.schema!=='avereo-private-publisher'||config.version!==1||config.enabled!==true||config.environment!=='preproduction'||!Number.isInteger(config.intervalSeconds)||config.intervalSeconds<60||config.intervalSeconds>3600)throw Error('publisher_disabled_or_invalid');
 const root=await realpath(config.privateRoot);if(root!==resolve(config.privateRoot)||(await lstat(root)).isSymbolicLink())throw Error('private_root_refused');
 if(!Array.isArray(config.publicRoots)||!config.publicRoots.length||config.publicRoots.some(p=>resolve(p)===root||within(resolve(p),root)))throw Error('public_root_refused');
 if(process.platform!=='win32'&&((await lstat(root)).mode&0o077)!==0)throw Error('private_root_permissions_refused');
 const paths={};for(const k of ['registryFile','sourceReceiptFile','githubCacheFile','publicationKeyFile','githubTokenFile'])paths[k]=await privatePath(config[k],root);
 for(const k of ['storageDirectory','archiveDirectory','backupDirectory','workDirectory'])paths[k]=await privatePath(config[k],root,{directory:true});
 const dirs=['storageDirectory','archiveDirectory','backupDirectory','workDirectory'];for(let i=0;i<dirs.length;i++)for(let j=i+1;j<dirs.length;j++)if(paths[dirs[i]]===paths[dirs[j]]||within(paths[dirs[i]],paths[dirs[j]])||within(paths[dirs[j]],paths[dirs[i]]))throw Error('separate_private_zones_required');
 const key=(await readFile(paths.publicationKeyFile,'utf8')).trim(),token=(await readFile(paths.githubTokenFile,'utf8')).trim();if(key.length<32||token===key)throw Error('separate_keys_required');
 const lockFile=join(paths.workDirectory,'publisher.lock');let lock;try{lock=await open(lockFile,'wx',0o600);}catch{throw Error('publisher_already_running');}
 const statusFile=join(paths.storageDirectory,'publisher-status.json');let previousStatus=null;try{previousStatus=readPublisherStatus(await readFile(statusFile,'utf8'),key);}catch{}
 const startedAt=now();let sourceDigest='0'.repeat(64),sourcesReceivedAt=null,sequence=1,githubObservedAt=previousStatus?.githubObservedAt||null,transaction=null,credentialExpiresAt=previousStatus?.credentialExpiresAt||null;
 const status=async(ok)=>{const s={schema:'avereo-private-publisher-status',version:1,mode:'scheduled',status:ok?'ok':'failed',startedAt,finishedAt:now(),lastSuccessAt:ok?now():previousStatus?.lastSuccessAt||null,githubObservedAt,sourcesReceivedAt,sourceDigest,sequence,intervalSeconds:config.intervalSeconds,errorCode:ok?'':'publication_failed',credentialExpiresAt};await atomic(statusFile,JSON.stringify(signPublisherStatus(s,key)));};
 try{
  const store=await openDevelopmentSnapshotStore({directory:paths.storageDirectory,key,publicRoots:config.publicRoots}),previous=await store.readCurrent();sequence=previous.data.sequence;
  const registryBytes=await readFile(paths.registryFile),receiptBytes=await readFile(paths.sourceReceiptFile),registry=JSON.parse(registryBytes),receipt=JSON.parse(receiptBytes);
  if(receipt.schema!=='avereo-private-source-receipt'||receipt.version!==1||!Number.isFinite(Date.parse(receipt.receivedAt))||Date.parse(receipt.receivedAt)>Date.parse(now())+60000||!receipt.sourceHashes||registry.entries?.some(e=>e.writable!==false))throw Error('source_receipt_required');
  sourcesReceivedAt=receipt.receivedAt;
  const input=new Map([[paths.registryFile,hash(registryBytes)],[paths.sourceReceiptFile,hash(receiptBytes)]]);
  for(const e of registry.entries){const p=await privatePath(resolve(e.root,e.file),root);if(!receipt.sourceHashes[p])throw Error('source_not_admitted');const h=hash(await readFile(p));if(receipt.sourceHashes[p]!==h)throw Error('admitted_source_changed');input.set(p,h);}
  for(const k of ['evidenceQualificationFile','patrimonyObservationFile'])if(registry[k]){const p=await privatePath(registry[k],root);input.set(p,hash(await readFile(p)));}
  sourceDigest=hash(JSON.stringify([...input].sort()));
  const cacheBytes=await readFile(paths.githubCacheFile),cache=JSON.parse(cacheBytes);
  const request=requestGithub||githubReadRequest(token,{repositories:config.repositories,onExpiry:value=>{credentialExpiresAt=value;}});
  const github=await collectGithubSnapshot(cache,{repositories:config.repositories,request,now});githubObservedAt=github.observedAt;
  github.method='scheduled_private_host_read_only_github_get';github.refresh.mode='scheduled_private_host';
  const staged=join(paths.workDirectory,randomUUID()+'.github.json');const f=await open(staged,'wx',0o600);try{await f.writeFile(JSON.stringify(github));await f.sync();}finally{await f.close();}
  let next;try{
   next=retainPublishedHistory(await exportSnapshot({...registry,githubObservationFile:staged},{sequence:previous.index.highWater+1,publisherId:'private-host-operator',proofSelection:[]}),previous.data);
   const summaries=next.iterations.map(v=>({...v,blockerCount:v.blockers.length,phases:v.phases.map(p=>({...p,criteria:p.criteria.length,approved:p.criteria.filter(c=>c.decision==='approved').length}))}));
   next.portfolio=await developmentPortfolio(registry.applications,summaries,{...github,status:'observed'});
   for(const row of next.portfolio){const old=previous.data.portfolio.find(v=>v.id===row.id);if(old?.local)row.local=old.local;if(old?.localReference)row.localReference=old.localReference;}
  }finally{await unlink(staged);}
  for(const [file,h]of input)if(hash(await readFile(file))!==h)throw Error('concurrent_source_change');
  if(!(await readFile(paths.githubCacheFile)).equals(cacheBytes))throw Error('concurrent_github_change');
  let published=false;
  if(semanticSnapshot(next)!==semanticSnapshot(previous.data)){
   const envelope=sealDevelopmentSnapshot(next,key); // Refuse incomplete output before any archive or publication.
   const backup=join(paths.backupDirectory,randomUUID());await mkdir(backup,{mode:0o700});
   for(const name of ['index.json',previous.index.current.file]){
    const source=join(paths.storageDirectory,name),bytes=await readFile(source),out=await open(join(backup,name),'wx',0o600);try{await out.writeFile(bytes);await out.sync();}finally{await out.close();}
    if(!(await readFile(join(backup,name))).equals(bytes))throw Error('backup_failed');
   }
   if((await readdir(paths.storageDirectory)).filter(n=>n.endsWith('.snapshot.json')).length>=19)await store.archiveInactive(paths.archiveDirectory);
   const live=await store.readCurrent();if(live.index.current.hash!==previous.index.current.hash||live.index.highWater!==previous.index.highWater)throw Error('concurrent_publication');
   transaction={store,previous,hash:hash(JSON.stringify(envelope))};await store.importSnapshot(envelope);const installed=await store.readCurrent();if(installed.data.sequence!==next.sequence)throw Error('publication_verification_failed');
   sequence=next.sequence;published=true;
  }
  await atomic(paths.githubCacheFile,JSON.stringify(github));await status(true);
  return{status:'ok',published,sequence,githubObservedAt,sourcesReceivedAt,sourceDigest};
 }catch{if(transaction){try{await transaction.store.restorePrevious({expectedCurrentHash:transaction.hash,expectedPreviousHash:transaction.previous.index.current.hash});sequence=transaction.previous.data.sequence;}catch{}}
  await status(false);throw Error('private_publication_failed_check_signed_state');}
 finally{const a=await lock.stat(),b=await lstat(lockFile);if(a.ino===b.ino&&a.dev===b.dev){await lock.close();await unlink(lockFile);}else{await lock.close();throw Error('publisher_lock_replaced');}}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{if(process.argv.length!==4||process.argv[2]!=='--config')throw Error();const config=JSON.parse(await readFile(process.argv[3],'utf8'));await privatePath(resolve(process.argv[3]),await realpath(config.privateRoot));console.log(JSON.stringify(await runPrivatePublisher(config)));}
 catch{console.error('Publication privée non réalisée ou incomplète ; consulter l’état privé signé.');process.exitCode=1;}
}
