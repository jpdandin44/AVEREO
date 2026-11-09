import {readFile,writeFile,open,rename,unlink,readdir,lstat,realpath} from 'node:fs/promises';
import {resolve,join,relative,isAbsolute} from 'node:path';
import {createHash,createHmac,timingSafeEqual,randomUUID} from 'node:crypto';
import {DevelopmentError} from './development-access.mjs';

const MAX=32*1024*1024;
const hash=b=>createHash('sha256').update(b).digest('hex');
const fail=(status,message)=>{throw new DevelopmentError(status,message);};
const id=x=>typeof x==='string'&&/^[a-zA-Z0-9_-]{1,100}$/.test(x);
const phases=['Cadrage','Développement local','Préproduction','Mise en production'];
const forbidden=['__proto__','prototype','constructor'];
const allowedExt=['.md','.txt','.log','.json','.png','.jpg','.jpeg','.pdf'];
function inspect(value,depth=0){
  if(depth>40)fail(422,'Projection trop profonde.');
  if(value&&typeof value==='object')for(const [k,v] of Object.entries(value)){if(forbidden.includes(k))fail(422,'Projection invalide.');inspect(v,depth+1);}
}
function validate(data){
  if(!data||data.schema!=='avereo-private-development-snapshot'||data.version!==1||!Number.isSafeInteger(data.sequence)||data.sequence<1
    || !id(data.publisherId)||Number.isNaN(Date.parse(data.generatedAt))||!Array.isArray(data.iterations)||!data.iterations.length||data.iterations.length>50
    ||!Array.isArray(data.portfolio)||data.portfolio.length>50||!Array.isArray(data.proofs)||data.proofs.length>500)fail(422,'Projection invalide.');
  inspect(data);
  const ids=new Set();
  for(const item of data.iterations){
    if(!id(item.id)||ids.has(item.id)||item.writable!==false||!Array.isArray(item.phases)||JSON.stringify(item.phases.map(p=>p.label))!==JSON.stringify(phases)
      ||!Array.isArray(item.applicationIds)||!item.applicationIds.every(id)||typeof item.source!=='string'||/^[A-Za-z]:[\\/]|^\//.test(item.source))fail(422,'Itération privée invalide.');
    if(!/^[a-f0-9]{64}$/.test(item.revision||'')||!/^[a-f0-9]{64}$/.test(item.sourceHash||'')||!Array.isArray(item.blockers)||!Array.isArray(item.history)
      ||!Array.isArray(item.declaredApprovals)||!Array.isArray(item.unassignedCriteria)||!item.candidate||!item.versions)fail(422,'Contrat de consultation incomplet.');
    if(item.unassignedProofs!==undefined&&(!Array.isArray(item.unassignedProofs)||item.unassignedProofs.length>2000))fail(422,'Pièces sans phase invalides.');
    ids.add(item.id);
    for(const [number,phase] of item.phases.entries()){if(phase.id!==number||!Array.isArray(phase.criteria)||!Array.isArray(phase.proofs)||phase.criteria.length>2000||phase.proofs.length>2000)fail(422,'Phase invalide.');}
  }
  const apps=new Set();
  for(const app of data.portfolio){if(!id(app.id)||apps.has(app.id)||typeof app.name!=='string'||!app.local||!Array.isArray(app.iterations)||!Array.isArray(app.unqualifiedDeliveries)
    ||app.iterations.some(item=>!ids.has(item.id)))fail(422,'Catalogue privé invalide.');apps.add(app.id);}
  if(!data.portfolio.length||data.iterations.some(item=>item.applicationIds.some(app=>!apps.has(app))))fail(422,'Couverture applicative incomplète.');
  const blobs=new Set();
  for(const p of data.proofs){
    const name=p.iterationId+':'+p.proofId;
    if(!ids.has(p.iterationId)||!id(p.proofId)||blobs.has(name)||!allowedExt.includes(p.ext)||typeof p.content!=='string'||p.content.length>14*1024*1024
      ||!/^[A-Za-z0-9+/]*={0,2}$/.test(p.content))fail(422,'Pièce privée invalide.');
    const bytes=Buffer.from(p.content,'base64');
    if(bytes.length>10*1024*1024||bytes.toString('base64')!==p.content||hash(bytes)!==p.sha256)fail(422,'Intégrité de pièce invalide.');
    if(p.ext==='.png'&&!bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])))fail(422,'Image invalide.');
    if(['.jpg','.jpeg'].includes(p.ext)&&!bytes.subarray(0,2).equals(Buffer.from([255,216])))fail(422,'Image invalide.');
    if(p.ext==='.pdf'&&!bytes.subarray(0,5).equals(Buffer.from('%PDF-')))fail(422,'PDF invalide.');
    const iteration=data.iterations.find(i=>i.id===p.iterationId),references=iteration.phases.flatMap(phase=>phase.proofs).concat(iteration.unassignedProofs||[]);
    if(!references.some(proof=>proof.id===p.proofId&&proof.fileHash===p.sha256))fail(422,'Pièce non déclarée.');
    blobs.add(name);
  }
  for(const item of data.iterations)for(const p of item.phases.flatMap(x=>x.proofs).concat(item.unassignedProofs||[]))if(p.availability==='available'&&!blobs.has(item.id+':'+p.id))fail(422,'Pièce déclarée absente.');
  return data;
}
export function sealDevelopmentSnapshot(data,key){
  if(typeof key!=='string'||key.length<32)throw Error('Clé de publication dédiée requise.');
  validate(data);const payload=JSON.stringify(data);if(Buffer.byteLength(payload)>MAX)fail(413,'Projection trop volumineuse.');
  return {payload,signature:createHmac('sha256',key).update(payload).digest('hex')};
}
function unseal(envelope,key){
  if(!envelope||Object.keys(envelope).sort().join(',')!=='payload,signature'||typeof envelope.payload!=='string'||Buffer.byteLength(envelope.payload)>MAX
    ||!/^[a-f0-9]{64}$/.test(envelope.signature||''))fail(422,'Projection non authentifiée.');
  if(!timingSafeEqual(Buffer.from(envelope.signature,'hex'),createHmac('sha256',key).update(envelope.payload).digest()))fail(403,'Projection non authentifiée.');
  try{return JSON.parse(envelope.payload);}catch{fail(422,'Projection illisible.');}
}
export async function openDevelopmentSnapshotStore({directory,key,publicRoots=[],maxSnapshots=20}){
  if(typeof key!=='string'||key.length<32||!Number.isInteger(maxSnapshots)||maxSnapshots<2||maxSnapshots>100)throw Error('Configuration privée invalide.');
  const root=await realpath(directory);
  if(resolve(directory)!==root||(await lstat(root)).isSymbolicLink())throw Error('Stockage privé non canonique.');
  for(const pub of publicRoots){const rel=relative(resolve(pub),root);if(!rel||rel!=='..'&&!rel.startsWith('..\\')&&!rel.startsWith('../')&&!isAbsolute(rel))throw Error('Stockage dans une racine publique.');}
  const indexFile=join(root,'index.json');
  async function safeRead(name,limit=MAX*2){
    if(!/^(?:index\.json|[a-f0-9-]{36}\.snapshot\.json)$/.test(name))fail(422,'Référence privée invalide.');
    const file=join(root,name),info=await lstat(file);
    if(!info.isFile()||info.isSymbolicLink()||info.size>limit||await realpath(file)!==file)fail(503,'Stockage privé indisponible.');
    return JSON.parse(await readFile(file,'utf8'));
  }
  const signedIndex=value=>{const payload=JSON.stringify(value);return {payload,signature:createHmac('sha256',key).update(payload).digest('hex')};};
  async function index(){
    try{
      const x=unseal(await safeRead('index.json',65536),key);
      if(x.version!==1||!Number.isSafeInteger(x.highWater)||x.highWater<1||!x.current||typeof x.current.file!=='string'||!/^[a-f0-9]{64}$/.test(x.current.hash||'')
        ||x.previous&&(!/^[a-f0-9]{64}$/.test(x.previous.hash||'')||typeof x.previous.file!=='string'))fail(503,'Index privé invalide.');
      return x;
    }catch(e){if(e.code==='ENOENT')return null;throw e;}
  }
  async function atomicIndex(value){
    const temporary=join(root,randomUUID()+'.tmp');let created=false;
    try{const out=await open(temporary,'wx',0o600);created=true;try{await out.writeFile(JSON.stringify(signedIndex(value)));await out.sync();}finally{await out.close();}await rename(temporary,indexFile);created=false;}
    finally{if(created)await unlink(temporary).catch(()=>{});}
  }
  async function locked(action){
    let lock;try{lock=await open(join(root,'publish.lock'),'wx',0o600);}catch{fail(409,'Publication privée déjà en cours.');}
    try{return await action();}finally{await lock.close();await unlink(join(root,'publish.lock'));}
  }
  async function readCurrent(){
    const ix=await index();if(!ix)fail(503,'Aucune projection privée publiée.');
    const envelope=await safeRead(ix.current.file);
    if(hash(JSON.stringify(envelope))!==ix.current.hash)fail(503,'Projection privée altérée.');
    const data=validate(unseal(envelope,key));
    return {data,index:ix};
  }
  return {
    async importSnapshot(envelope){
      // Complete validation before creating any file or taking the publication lock.
      const data=validate(unseal(envelope,key));
      return locked(async()=>{
        const previous=await index();
        if(previous&&data.sequence<=previous.highWater)fail(409,'Projection ancienne ou déjà publiée.');
        if(previous){const active=await safeRead(previous.current.file);validate(unseal(active,key));if(hash(JSON.stringify(active))!==previous.current.hash)fail(503,'Projection courante altérée.');}
        if((await readdir(root)).filter(n=>n.endsWith('.snapshot.json')).length>=maxSnapshots)fail(507,'Quota privé atteint ; aucune suppression automatique.');
        const file=randomUUID()+'.snapshot.json',bytes=JSON.stringify(envelope);const out=await open(join(root,file),'wx',0o600);
        try{await out.writeFile(bytes);await out.sync();}finally{await out.close();}
        await atomicIndex({version:1,highWater:data.sequence,current:{file,hash:hash(bytes)},previous:previous?.current||null,
          receivedAt:new Date().toISOString(),restored:false});
        return {sequence:data.sequence,generatedAt:data.generatedAt};
      });
    },
    async restorePrevious(){return locked(async()=>{const ix=await index();if(!ix?.previous)fail(409,'Aucune copie précédente.');const env=await safeRead(ix.previous.file);validate(unseal(env,key));if(hash(JSON.stringify(env))!==ix.previous.hash)fail(503,'Copie précédente altérée.');await atomicIndex({...ix,current:ix.previous,previous:ix.current,restored:true,restoredAt:new Date().toISOString()});});},
    async dashboard(){const {data,index:ix}=await readCurrent();return {iterations:data.iterations.map(v=>({id:v.id,title:v.title,application:v.application,applicationIds:v.applicationIds,status:v.status,currentPhase:v.currentPhase,versions:v.versions,nextAction:v.nextAction,blockerCount:v.blockers.length,phases:v.phases.map(p=>({id:p.id,label:p.label,status:p.status,criteria:p.criteria.length,approved:p.criteria.filter(c=>c.decision==='approved').length}))})),portfolio:data.portfolio,githubSnapshot:data.githubSnapshot||null,githubRefreshAvailable:false,
      snapshot:{sequence:data.sequence,generatedAt:data.generatedAt,receivedAt:ix.receivedAt,restored:ix.restored===true,mode:'private_read_only_projection'}};},
    async get(id){const {data}=await readCurrent();const view=data.iterations.find(i=>i.id===id);if(!view)fail(404,'Itération indisponible.');return {...view,readAt:new Date().toISOString()};},
    async proof(iterationId,proofId){const {data}=await readCurrent();const blob=data.proofs.find(p=>p.iterationId===iterationId&&p.proofId===proofId);if(!blob)fail(404,'Pièce non publiée.');return {content:Buffer.from(blob.content,'base64'),ext:blob.ext,name:proofId+blob.ext};},
    async review(){fail(403,'Projection strictement consultative.');},
    readCurrent,
  };
}
