import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {realpath} from 'node:fs/promises';
import {relative,isAbsolute} from 'node:path';
const exec=promisify(execFile);
const sha=value=>typeof value==='string'&&/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(value)?value:null;
const text=value=>typeof value==='string'?value:null;
export function latestDeclaredDate(data){
  const values=[data.updatedAt,data.observedAt,data.updated,data.github?.observedAt,data.candidate?.observedAt,data.delivery?.observedAt,...(Array.isArray(data.checks)?data.checks.map(c=>c.observedAt):[])];
  return values.filter(v=>typeof v==='string'&&!Number.isNaN(Date.parse(v))).sort((a,b)=>Date.parse(b)-Date.parse(a))[0]||null;
}
export async function inspectDevelopmentGit(directory){
  if(!directory)return{status:'not_configured',observedAt:new Date().toISOString()};
  try{
    const cwd=await realpath(directory);
    const git=async args=>(await exec('git',['-C',cwd,...args],{timeout:6000,maxBuffer:1024*1024,windowsHide:true})).stdout.trim();
    const repository=await realpath(await git(['rev-parse','--show-toplevel']));
    const sub=relative(repository,cwd);if(sub==='..'||sub.startsWith('..\\')||sub.startsWith('../')||isAbsolute(sub))throw Error();
    const [headSha,branch,applicationCommit,changes]=await Promise.all([
      git(['rev-parse','HEAD']),git(['branch','--show-current']),git(['log','-1','--format=%H','--','.']),git(['status','--porcelain','--untracked-files=normal','--','.'])
    ]);
    const committedTree=await git(['rev-parse',sub?'HEAD:'+sub.replaceAll('\\','/'):'HEAD^{tree}']);
    return{status:'observed',headSha:sha(headSha),branch:branch||'Tête détachée',applicationCommit:sha(applicationCommit),committedTree,dirty:changes.length>0,observedAt:new Date().toISOString()};
  }catch{return{status:'unavailable',observedAt:new Date().toISOString(),message:'Version Git locale indisponible.'};}
}
export function projectDevelopmentVersions(data,source){
  const c=data.candidate||{},g=data.github||{},d=data.delivery||{};
  const declarations=[];
  // Une phase/CI réussie ne prouve pas une livraison. L'environnement est
  // explicitement qualifié dans le registre, jamais déduit d'un nom de domaine.
  if(source.deliveryEnvironment&&['delivered','delivered_verified'].includes(d.status))declarations.push({environment:source.deliveryEnvironment,sourceSha:sha(d.sourceSha),artifactSha256:sha(d.artifactSha256),observedAt:text(d.observedAt),target:text(d.target),evidence:text(d.evidence),scope:'declared_lot_not_full_application'});
  const m=data.preproduction?.deployment;
  if(source.deliveryAdapter==='missions-preproduction'&&source.deliveryEnvironment==='preproduction'&&m?.status==='installed_and_verified')declarations.push({environment:'preproduction',applicationIds:source.deliveryApplicationIds||[],sourceSha:sha(g.codeSourceSha),artifactSha256:sha(m.artifactSha256)||sha(data.preproduction.artifactSha256),observedAt:text(m.observedAt),target:'Lot Missions — cibles déclarées dans la source',evidence:text(m.evidence),scope:'declared_lot_not_full_application'});
  for(const declaration of declarations){
    // Same-version hosted evidence, not a green CI or a completed phase.
    const check=(Array.isArray(data.checks)?data.checks:[]).find(x=>x.kind===declaration.environment&&x.status==='passed'
      &&typeof x.evidence==='string'&&x.evidence.trim()&&typeof x.observedAt==='string'&&!Number.isNaN(Date.parse(x.observedAt))
      &&(declaration.sourceSha||declaration.artifactSha256)
      &&(!declaration.sourceSha||x.sourceSha===declaration.sourceSha)&&(!declaration.artifactSha256||x.artifactSha256===declaration.artifactSha256)
      &&typeof declaration.target==='string'&&declaration.target!==''&&x.target===declaration.target);
    declaration.verification=check?{status:'documented',evidence:check.evidence,observedAt:check.observedAt,meaning:'declared_hosted_check_not_live_monitoring'}:{status:'unqualified'};
  }
  return{candidate:{sourceSha:sha(c.sourceSha)||sha(c.codeSourceSha),artifactSha256:sha(c.artifactSha256),basis:text(c.qualificationBasis)},github:{url:text(g.prUrl)||text(g.url)||text(data.pr),headSha:sha(g.headSha)||sha(g.sourceSha)||sha(g.codeSourceSha),branch:text(g.branch)||text(data.branch),state:text(g.state)||text(g.status)||(g.merged===true?'merged':g.draft===true?'draft':null),observedAt:text(g.observedAt)},declarations,updatedAt:latestDeclaredDate(data)};
}
export async function developmentPortfolio(applications,iterations,github=null){
  return Promise.all(applications.map(async app=>{
    const items=iterations.filter(i=>i.applicationIds?.includes(app.id)).sort((a,b)=>Number((b.githubOpenPrCount||0)>0)-Number((a.githubOpenPrCount||0)>0)||(Date.parse(b.versions?.updatedAt)||0)-(Date.parse(a.versions?.updatedAt)||0));
    const declarations=items.flatMap(i=>(i.versions?.declarations||[]).filter(d=>!d.applicationIds||d.applicationIds.includes(app.id)).map(d=>({...d,iterationId:i.id,title:i.title})));
    const latest=environment=>declarations.filter(d=>d.environment===environment).sort((a,b)=>(Date.parse(b.observedAt)||0)-(Date.parse(a.observedAt)||0))[0]||null;
    const active=items.filter(i=>!i.unavailable);
    const local=await inspectDevelopmentGit(app.directory),remote=github?.status==='observed'?github.applications?.[app.id]:null;
    return{id:app.id,name:app.name,category:app.category||'Application',local,github:remote?{...remote,status:'observed',observedAt:github.observedAt,committedContentMatches:local.committedTree?local.committedTree===remote.mainTree:null}:{status:github?.status||'not_configured'},iterations:items.map(i=>({id:i.id,title:i.title,currentPhase:i.currentPhase,status:i.status,unavailable:i.unavailable||false,updatedAt:i.versions?.updatedAt||null,criteria:i.phases?.reduce((n,p)=>n+p.criteria,0)||0,approved:i.phases?.reduce((n,p)=>n+p.approved,0)||0})),preproduction:latest('preproduction'),production:latest('production'),unqualifiedDeliveries:items.filter(i=>i.hasUnqualifiedDelivery).map(i=>i.id),missingTracking:!active.length,blockerCount:active.reduce((n,i)=>n+(i.blockerCount||0),0)};
  }));
}
