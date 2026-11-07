import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createDevelopmentStore} from './development-store.mjs';
import {developmentPortfolio} from './development-versions.mjs';

const hash=x=>createHash('sha256').update(x).digest('hex');
export async function exportDevelopmentSnapshot(registry,{sequence,publisherId='local-owner',proofSelection=[]}={}){
  if(registry.schema!=='development-portfolio-registry'||!Array.isArray(registry.entries)||registry.entries.some(e=>e.writable!==false))throw Error('Sources strictement consultatives requises.');
  if(!Array.isArray(proofSelection)||proofSelection.length>500)throw Error('Sélection de pièces invalide.');
  const startedAt=new Date().toISOString(),store=await createDevelopmentStore(registry.entries,{applications:registry.applications});
  const views=await Promise.all(registry.entries.map(e=>store.get(e.id)));
  const proofs=[];
  for(const pick of proofSelection){
    if(!pick||Object.keys(pick).sort().join(',')!=='iterationId,proofId')throw Error('Sélection de pièces invalide.');
    const view=views.find(v=>v.id===pick.iterationId),proof=view?.phases.flatMap(p=>p.proofs).find(p=>p.id===pick.proofId);
    if(!proof||proof.availability!=='available')throw Error('Pièce sélectionnée indisponible.');
    const file=await store.proof(pick.iterationId,pick.proofId);
    if(hash(file.content)!==proof.fileHash)throw Error('Pièce modifiée pendant la publication.');
    proofs.push({...pick,ext:file.ext,sha256:proof.fileHash,content:file.content.toString('base64')});
  }
  for(const view of views)if(hash(await readFile(view.source))!==view.sourceHash)throw Error('Source modifiée pendant la publication.');
  const selected=new Set(proofs.map(p=>p.iterationId+':'+p.proofId));
  const normalize=(value,iterationId)=>{
    if(typeof value==='string')return value.replace(/[A-Za-z]:[\\/][^\n"<>]+/g,'[chemin local masqué]').replace(/\/home\/[A-Za-z0-9._-]+(?:\/[^\s"<>]*)?/g,'[chemin serveur masqué]');
    if(Array.isArray(value))return value.map(v=>normalize(v,iterationId));
    if(value&&typeof value==='object'){
      const result=Object.fromEntries(Object.entries(value).map(([k,v])=>[k,normalize(v,iterationId)]));
      if(Object.hasOwn(result,'canApprove'))result.canApprove=false;
      if(Object.hasOwn(result,'availability')&&result.availability==='available'&&!selected.has(iterationId+':'+result.id)){
        result.availability='unavailable';result.description='Pièce non publiée dans cette copie privée. '+(result.description||'');
      }
      return result;
    }
    return value;
  };
  const iterations=views.map(v=>({...normalize(v,v.id),source:'source-privee:'+v.id,writable:false,writeReason:'Copie de consultation ; aucune écriture dans la source canonique.'}));
  const summaries=iterations.map(v=>({...v,blockerCount:v.blockers.length,phases:v.phases.map(p=>({...p,criteria:p.criteria.length,approved:p.criteria.filter(c=>c.decision==='approved').length}))}));
  const portfolio=await developmentPortfolio(registry.applications,summaries);
  return {schema:'avereo-private-development-snapshot',version:1,publisherId,sequence,generatedAt:new Date().toISOString(),readWindow:{startedAt,endedAt:new Date().toISOString()},
    iterations,portfolio:normalize(portfolio,''),proofs};
}
