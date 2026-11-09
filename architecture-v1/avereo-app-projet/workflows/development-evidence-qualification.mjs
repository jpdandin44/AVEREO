import {readFile,realpath,stat,lstat} from 'node:fs/promises';
import {resolve,relative,isAbsolute,extname} from 'node:path';
import {createHash} from 'node:crypto';
export async function readEvidenceQualification(file){
 if(!file)return{status:'not_configured'};
 try{const b=await readFile(file);if(b.length>2*1024*1024)throw Error();const d=JSON.parse(b);if(d.schema!=='development-evidence-qualification'||!d.views||Number.isNaN(Date.parse(d.observedAt)))throw Error();return{...d,status:'observed'};}catch{return{status:'unavailable'};}
}
export function qualifiedView(data,id,sourceHash){const v=data.views?.[id];if(data.status==='observed'&&!v)return{status:'not_applicable',proofs:{},criteria:{}};return data.status==='observed'&&v?.sourceHash===sourceHash?{...v,status:'current',observedAt:data.observedAt}:{status:data.status==='observed'?'source_changed':data.status,proofs:{},criteria:{}};}
export async function qualifiedEvidence(record,declaredReference){
 if(record?.declaredReference!==declaredReference||!record.resource)return null;
 const r=record.resource;if(typeof r.root!=='string'||typeof r.file!=='string'||isAbsolute(r.file)||!/^[a-f0-9]{64}$/.test(r.sha256||''))return null;
 try{const root=resolve(r.root),path=resolve(root,r.file),rel=relative(root,path);if(!rel||rel==='..'||rel.startsWith('..\\')||rel.startsWith('../')||isAbsolute(rel)||!['.json','.md','.txt','.log','.pdf','.png','.jpg','.jpeg'].includes(extname(path).toLowerCase()))return null;
 if(await realpath(root)!==root||await realpath(path)!==path||(await lstat(root)).isSymbolicLink()||(await lstat(path)).isSymbolicLink()||(await stat(path)).size>10*1024*1024)return null;
 const content=await readFile(path),hash=createHash('sha256').update(content).digest('hex');if(hash!==r.sha256)return null;return{path,hash,ext:extname(path).toLowerCase()};}catch{return null;}
}
