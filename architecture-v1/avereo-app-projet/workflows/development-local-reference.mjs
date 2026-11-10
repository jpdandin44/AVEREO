import {win32} from 'node:path';

const sha=/^[a-f0-9]{40}$/;
const ids=['connect','rapport','rga','projet','coupe','thermo','drone','passeport-immo','recherche','saisie-unique'];
const cleanPath=value=>{
  if(typeof value!=='string'||value.length>1024||/[\x00-\x1f<>"|?*]/.test(value)||! /^[A-Za-z]:[\\/]/.test(value)||value.split(/[\\/]/).includes('..'))throw Error('Chemin de référence invalide.');
  return win32.normalize(value);
};

/** Explicit owner-only publication of folder labels. Never reads a local folder. */
export function qualifyLocalReference(catalogue){
  if(catalogue?.schema!=='avereo-local-reference-catalog'||!sha.test(catalogue.reference?.sha||'')||!Array.isArray(catalogue.applications)||catalogue.applications.length!==ids.length||Number.isNaN(Date.parse(catalogue.observedAt)))throw Error('Catalogue de référence invalide.');
  const archive=cleanPath(catalogue.referenceArchive?.path),root=win32.dirname(win32.dirname(archive));
  if(win32.basename(root).toLowerCase()!=='avereo-reference'||win32.basename(win32.dirname(archive))!=='sauvegardes')throw Error('Racine de référence inattendue.');
  const roots=[['reference','Dossier de référence',root],['developpements','Développements conservés',win32.join(root,'developpements')],['sauvegardes','Sauvegardes',win32.join(root,'sauvegardes')],['pilotage','Pilotage local',win32.join(root,'pilotage')]].map(([id,label,directory])=>({id,label,directory}));
  const applications=new Map();
  for(const app of catalogue.applications){
    if(!ids.includes(app.id)||applications.has(app.id)||app.referenceSha!==catalogue.reference.sha)throw Error('Application de référence invalide.');
    const suffix=app.id==='rga'?'avereo-app-rapport\\frontend\\public\\rga':'avereo-app-'+app.id;
    const expected=win32.join(root,'versions',catalogue.reference.sha.slice(0,12),'architecture-v1',suffix);
    const directory=cleanPath(app.referenceDirectory);
    if(directory.toLowerCase()!==expected.toLowerCase())throw Error('Dossier hors de la photographie de référence.');
    applications.set(app.id,{directory,sourceSha:catalogue.reference.sha,observedAt:catalogue.observedAt,roots});
  }
  return applications;
}

/** Extend the previously qualified projection; preserve every existing review. */
export function extendReferenceSnapshot(previous,referenceIteration,catalogue,{sequence}={}){
  if(previous?.schema!=='avereo-private-development-snapshot'||!Number.isSafeInteger(sequence)||sequence!==previous.sequence+1||previous.iterations.some(i=>i.id==='reference-applications'))throw Error('Publication précédente incompatible.');
  if(referenceIteration?.id!=='reference-applications'||referenceIteration.writable!==false)throw Error('Suivi de référence consultatif requis.');
  const references=qualifyLocalReference(catalogue),next=structuredClone(previous),added=structuredClone(referenceIteration);
  next.sequence=sequence;next.generatedAt=new Date().toISOString();next.iterations.push(added);
  for(const app of next.portfolio){
    if(!references.has(app.id))continue;
    app.localReference=references.get(app.id);
    app.iterations.push({id:added.id,title:added.title,currentPhase:added.currentPhase,status:added.status,unavailable:false,updatedAt:added.versions.updatedAt,criteria:added.phases.reduce((n,p)=>n+p.criteria.length,0),approved:0});
  }
  if(next.portfolio.filter(a=>a.localReference).length!==ids.length)throw Error('Portefeuille incomplet pour les dix applications.');
  return next;
}
