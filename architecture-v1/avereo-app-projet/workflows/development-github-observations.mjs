import {readFile} from 'node:fs/promises';
const valid=v=>typeof v==='string'&&/^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/pull\/[1-9][0-9]*$/.test(v);
const state=v=>typeof v==='string'?({open:'open',draft:'open',closed:'closed',merged:'merged'}[v.toLowerCase()]||null):null;
export async function readGithubObservations(file){
  if(!file)return {status:'not_configured'};
  try{const b=await readFile(file);if(b.length>2*1024*1024)throw Error();const d=JSON.parse(b);if(d.schema!=='development-github-observations'||Number.isNaN(Date.parse(d.observedAt))||!d.pullRequests||!d.applications)throw Error();return {...d,status:'observed'};}catch{return {status:'unavailable'};}
}
export function observeGithub(data,source,snapshot){
  const g=data.github||{},urls=new Set(),declared=new Map(),add=v=>{if(valid(v))urls.add(v);};
  const object=v=>{if(typeof v==='string')add(v);else if(v&&typeof v==='object'){const url=v.prUrl||v.url||(v.repository&&Number.isInteger(v.number||v.pullRequest)?'https://github.com/'+v.repository+'/pull/'+(v.number||v.pullRequest):null);add(url);if(valid(url))declared.set(url,{state:v.merged===true?'merged':state(v.state||v.status),headSha:v.headSha||v.observedHeadSha||null});}};
  object(g);add(data.pr);add(data.sourcePr);object(data.productionReviewPullRequest);
  for(const p of data.phases||[])if(typeof p==='object')object(p.pullRequest);
  for(const url of source.githubPrUrls||[])add(url);
  return {status:snapshot.status,observedAt:snapshot.status==='observed'?snapshot.observedAt:null,pullRequests:[...urls].map(url=>{const o=snapshot.status==='observed'?snapshot.pullRequests?.[url]:null,d=declared.get(url)||{},s=d.state||null;return o?{...o,url,declaredState:s,declaredHeadSha:d.headSha,stateDiscrepancy:!!s&&s!==o.state,headDiscrepancy:!!d.headSha&&d.headSha!==o.headSha}:{url,status:'unavailable',declaredState:s};})};
}
