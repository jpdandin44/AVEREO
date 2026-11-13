import {readFile,realpath,stat,open,mkdir,rename,unlink} from 'node:fs/promises';
import {resolve,relative,isAbsolute,dirname,extname,join} from 'node:path';
import {createHash,randomUUID} from 'node:crypto';
import {DevelopmentError} from './development-access.mjs';
import {projectDevelopmentVersions,developmentPortfolio} from './development-versions.mjs';
import {readGithubObservations,observeGithub} from './development-github-observations.mjs';
import {readEvidenceQualification,qualifiedView,qualifiedEvidence} from './development-evidence-qualification.mjs';
import {readPatrimonyObservation} from './development-patrimony.mjs';

export const DEVELOPMENT_PHASES=['Cadrage','Développement local','Préproduction','Mise en production'];
const hash=v=>createHash('sha256').update(typeof v==='string'||Buffer.isBuffer(v)?v:JSON.stringify(v)).digest('hex');
const fail=(s,m)=>{throw new DevelopmentError(s,m);};
const inside=(root,file)=>{const p=relative(root,file);return p!== '..'&&!p.startsWith('..\\')&&!p.startsWith('../')&&!isAbsolute(p);};
const phaseKeys=['cadrage','developpement-local','preproduction','mise-en-production'];
const stages={cadrage:0,'developpement-local':1,developpement_local:1,development:1,local:1,preproduction:2,production:3,'mise-en-production':3};
const checkPhase={local:1,ci:1,documentation:1,preproduction:2,production:3};
const limit=2*1024*1024;
const safeText=v=>typeof v==='string'?v:'';
const sha=/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i;
const withoutReviews=data=>{const copy={...data};delete copy.developmentReviews;return copy;};
function workflow(raw){return raw.developmentWorkflow&&typeof raw.developmentWorkflow==='object'?raw.developmentWorkflow:raw;}
function selectProjection(raw,source){
  let v=raw;if(source.dataPath){for(const key of source.dataPath.split('.')){if(!v||typeof v!=='object'||!Object.hasOwn(v,key))fail(422,'Sous-suivi déclaré introuvable.');v=v[key];}}else v=workflow(raw);
  if(source.iterationKey){if(!Array.isArray(v))fail(422,'Liste d’itérations absente.');const matches=v.filter(x=>x?.iterationId===source.iterationKey);if(matches.length!==1)fail(422,'Itération absente ou ambiguë.');v=matches[0];}
  if(source.recordKind==='receipt'){const phase=source.deliveryEnvironment==='production'?3:2;v={iterationId:source.id,stage:phase===3?'production':'preproduction',status:'delivery_receipt_declared',candidate:{sourceSha:v.sourceSha,artifactSha256:v.artifactSha256},github:{prUrl:v.sourcePr},delivery:{status:'delivered',sourceSha:v.sourceSha,artifactSha256:v.artifactSha256,target:v.target,observedAt:v.deployedAt,evidence:relative(source.root,source.file)},checks:[{id:'declared-receipt',phaseId:phase,kind:'document',status:'reviewable',evidence:relative(source.root,source.file),observedAt:v.deployedAt}],nextAction:'Reçu déclaré consultable ; état hébergé actuel et revue humaine non déduits.'};}
  else if(source.recordKind==='declaration')v={...v,iterationId:v.iterationId||source.id};
  if(source.includeRootPhases)v={...v,phases:raw.phases,currentPhase:raw.currentPhase};return v;
}
function safeLink(value){try{const u=new URL(value);return u.protocol==='https:'&&!u.username&&!u.password?u.href:null;}catch{return null;}}

export async function createDevelopmentStore(entries,{adminId=null,applications=[],githubObservationFile=null,evidenceQualificationFile=null,patrimonyObservationFile=null}={}){
  if(!Array.isArray(entries)||!entries.length||entries.length>50)throw new Error('Registre privé absent ou invalide.');
  if(evidenceQualificationFile&&entries.some(e=>e.writable!==false))throw Error('Qualifications réservées aux sources consultatives.');
  const sources=new Map();
  for(const entry of entries){
    if(!/^[a-z0-9_-]{1,80}$/.test(entry.id||'')||sources.has(entry.id))throw new Error('Identifiant du registre invalide.');
    const root=await realpath(entry.root),file=resolve(root,entry.file);
    if(!inside(root,file)||extname(file)!=='.json')throw new Error('Source hors du dossier autorisé.');
    // Une référence manquante reste visible comme indisponible, pas verte.
    try{if(!inside(root,await realpath(file)))throw new Error('Source hors du dossier autorisé.');}catch(error){if(error.code!=='ENOENT')throw error;}
    if(entry.deliveryEnvironment&&!['preproduction','production'].includes(entry.deliveryEnvironment))throw Error('Environnement de livraison invalide.');
    if(entry.evidenceBase&&(typeof entry.evidenceBase!=='string'||isAbsolute(entry.evidenceBase)||!inside(root,resolve(root,entry.evidenceBase))))throw Error('Base des pièces hors du dossier autorisé.');
    if(entry.dataPath&&(typeof entry.dataPath!=='string'||entry.dataPath.split('.').some(k=>!/^[a-zA-Z0-9_-]+$/.test(k)||['__proto__','prototype','constructor'].includes(k))||entry.writable===true))throw Error('Projection privée invalide ou demandée en écriture.');
    if((entry.iterationKey||entry.recordKind||entry.includeRootPhases||entry.deliveryAdapter)&&entry.writable!==false)throw Error('Adaptateur strictement consultatif requis.');
    if(entry.iterationKey&&(typeof entry.iterationKey!=='string'||!entry.dataPath||!/^[a-zA-Z0-9_-]{1,120}$/.test(entry.iterationKey)))throw Error('Sélecteur d’itération invalide.');
    if(entry.recordKind&&!['receipt','declaration'].includes(entry.recordKind))throw Error('Adaptateur inconnu.');
    if(entry.recordKind==='receipt'&&!entry.deliveryEnvironment)throw Error('Environnement du reçu requis.');
    if(entry.deliveryAdapter&&!['missions-preproduction'].includes(entry.deliveryAdapter))throw Error('Adaptateur de livraison inconnu.');
    if(entry.deliveryApplicationIds&&(!Array.isArray(entry.deliveryApplicationIds)||entry.deliveryApplicationIds.some(id=>!entry.applicationIds?.includes(id))))throw Error('Périmètre de livraison invalide.');
    sources.set(entry.id,{...entry,applicationIds:entry.applicationIds||[entry.id],root,file});
  }
  if(!applications.length)applications=[...sources.values()].map(s=>({id:s.applicationIds[0],name:s.application||s.id})).filter((a,i,list)=>list.findIndex(b=>b.id===a.id)===i);
  if(new Set(applications.map(a=>a.id)).size!==applications.length||applications.some(a=>!/^[a-z0-9_-]{1,80}$/.test(a.id)))throw Error('Catalogue applicatif invalide.');
  for(const source of sources.values())if(!Array.isArray(source.applicationIds)||source.applicationIds.some(id=>!applications.some(a=>a.id===id)))throw Error('Application du registre inconnue.');
  async function snapshot(id){
    const source=sources.get(id);if(!source)fail(404,'Itération introuvable.');
    if(await realpath(source.file)!==source.file)fail(403,'Source indisponible.');
    const bytes=await readFile(source.file);if(bytes.length>limit)fail(413,'Suivi trop volumineux.');
    let raw;try{raw=JSON.parse(bytes.toString('utf8').replace(/^\uFEFF/,''));}catch{fail(422,'Suivi illisible.');}
    const data=selectProjection(raw,source);
    const qualification=qualifiedView(await readEvidenceQualification(evidenceQualificationFile),id,hash(bytes));
    if(!data||typeof data!=='object'||Array.isArray(data))fail(422,'Schéma du suivi non reconnu.');
    const structured=Array.isArray(data.phases)&&data.phases.every(p=>p&&typeof p==='object');
    if(!structured&&!(typeof data.stage==='string'||typeof data.iterationId==='string'))fail(422,'Schéma du suivi non reconnu.');
    const map=p=>{
      if(source.phaseMap&&Object.hasOwn(source.phaseMap,String(p)))return source.phaseMap[String(p)];
      return Number.isInteger(p)&&p>=0&&p<4?p:null;
    };
    if(structured&&data.phases.length!==4&&!source.phaseMap)fail(422,'Mapping historique vers quatre phases requis.');
    const candidate=data.candidate||{};
    const candidateFingerprint=hash(Object.keys(candidate).length?candidate:withoutReviews(raw));
    const namedPhase=DEVELOPMENT_PHASES.indexOf(data.phase);
    const current=structured&&Number.isInteger(data.currentPhase)?map(data.currentPhase):stages[data.stage]??(namedPhase>=0?namedPhase:null);
    const phases=DEVELOPMENT_PHASES.map((label,id)=>({id,key:phaseKeys[id],label,status:'not_reported',criteria:[],proofs:[]}));
    if(structured){
      for(const p of data.phases){const target=map(p.id);if(target===null||!phases[target])fail(422,'Phase non mappée.');const phase=phases[target];phase.status=phase.status==='not_reported'?safeText(p.status)||'not_reported':phase.status===p.status?phase.status:'mixed';}
    }else if(current!==null){phases[current].status=safeText(data.status)||'in_progress';}
    const proofs=[],files=new Map();
    const definitions=[...(Array.isArray(data.proofs)?data.proofs:[]),...(Array.isArray(data.checks)?data.checks:[])].map(item=>({item,phase:Number.isInteger(item.phaseId)?map(item.phaseId):checkPhase[item.kind]??checkPhase[item.environment]??null}));
    if(typeof data.evidence==='string')definitions.push({item:{id:'declared-evidence',title:'Dossier de qualification déclaré',kind:'reference_document',status:'reviewable',evidence:data.evidence},phase:current});
    if(structured)for(const p of data.phases)for(const d of p.deliverables||[])definitions.push({item:{...d,id:d.id||'document-'+hash([p.id,d.path||d]).slice(0,16),kind:'document',evidence:d.path,status:d.status||'reviewable'},phase:map(p.id)});
    for(const {item,phase} of definitions){
      const id=safeText(item.id)||'proof-'+hash(item).slice(0,20);
      if(proofs.some(p=>p.id===id))fail(422,'Identifiant de preuve dupliqué.');
      const evidence=safeText(item.path)||safeText(item.evidence),url=safeLink(evidence);
      const proof={id,phaseId:phase,title:safeText(item.title)||safeText(item.label)||safeText(item.id)||safeText(item.kind)||'Preuve',kind:safeText(item.kind),status:safeText(item.status)||'not_reported',sourceSha:safeText(item.sourceSha),artifactSha256:safeText(item.artifactSha256),target:safeText(item.target),observedAt:safeText(item.observedAt),description:evidence,url,availability:url?'reference':'unverified',fileHash:null};
      proof.freshness=sha.test(candidate.sourceSha||'')&&sha.test(proof.sourceSha)?candidate.sourceSha===proof.sourceSha?'current':'stale':/^[a-f0-9]{64}$/i.test(candidate.artifactSha256||'')&&/^[a-f0-9]{64}$/i.test(proof.artifactSha256)?candidate.artifactSha256===proof.artifactSha256?'current':'stale':proof.kind==='document'?'current':'unverified';
      if(candidate.artifactSha256&&proof.artifactSha256&&candidate.artifactSha256!==proof.artifactSha256)proof.freshness='stale';
      // Un chemin doit être relatif, déclaré et résolu dans la racine autorisée.
      const looksFile=!url&&/\.(md|json|txt|log|png|jpe?g|pdf)$/i.test(evidence);
      if(looksFile){
        proof.availability='unavailable';
        try{
          if(isAbsolute(evidence))throw new Error();
          const paths=[resolve(source.root,evidence),...(source.evidenceBase?[resolve(source.root,source.evidenceBase,evidence)]:[])];
          for(const path of paths){try{
            const actual=await realpath(path);if(!inside(source.root,actual)||(await stat(actual)).size>10*1024*1024)continue;
            const content=await readFile(actual);
            proof.fileHash=hash(content);proof.availability='available';files.set(id,{path:actual,hash:proof.fileHash,ext:extname(actual).toLowerCase()});
            if(item.sha256&&item.sha256!==proof.fileHash)proof.freshness='stale';break;
          }catch{/* Le chemin déclaré alternatif reste confiné à la même racine. */}}
        }catch{/* Pas de chemin physique révélé dans l'erreur d'une pièce indisponible. */}
      }
      const qualified=qualification.proofs?.[id];
      if(qualified?.declaredReference===evidence){const exact=await qualifiedEvidence(qualified,evidence);if(qualified.resource){if(exact){files.set(id,exact);proof.fileHash=exact.hash;proof.availability='available';}else{files.delete(id);proof.fileHash=null;proof.availability='unavailable';proof.freshness='stale';}}
        proof.referenceQualification={status:qualified.resource?(exact?'resolved_exact_file':'file_changed_or_unavailable'):qualified.status,role:qualified.role,reason:qualified.reason,observedAt:qualification.observedAt};}
      proof.fingerprint=hash({...proof});proofs.push(proof);if(phase!==null)phases[phase].proofs.push(proof);
    }
    const allCriteria=[];const unassigned=[];
    const reviewHistory=source.dataPath?(Array.isArray(data.developmentReviews)?data.developmentReviews:[]):(Array.isArray(raw.developmentReviews)?raw.developmentReviews:[]);
    function criterion(item,phase,sourcePhase=phase){
      const object=typeof item==='string'?{title:item}:item;
      if(!object||typeof object!=='object')return;
      const title=safeText(object.title)||safeText(object.text)||safeText(object.expected);
      if(!title)return;
      const id=safeText(object.id)||'legacy-'+hash([sourcePhase,title]).slice(0,20);
      if(allCriteria.some(c=>c.id===id))fail(422,'Identifiant de critère dupliqué.');
      const refs=Array.isArray(object.proofIds)?object.proofIds.filter(x=>typeof x==='string'):[];
      const c={id,phaseId:phase,title,expected:safeText(object.expected),required:object.required!==false,proofIds:refs,proofs:refs.map(id=>proofs.find(p=>p.id===id)).filter(Boolean)};
      c.fingerprint=hash({id,title,expected:c.expected,required:c.required,phaseId:phase,proofIds:refs});
      const history=reviewHistory.filter(e=>e.criterionId===id);
      const last=history.filter(e=>e.action!=='comment').at(-1);
      const proofBindings=c.proofs.map(p=>({id:p.id,fingerprint:p.fingerprint}));
      const fresh=last&&last.criterionFingerprint===c.fingerprint&&last.candidateFingerprint===candidateFingerprint&&JSON.stringify(last.proofs)===JSON.stringify(proofBindings);
      c.decision=last?(fresh?last.action==='approve'?'approved':'changes_requested':'stale'):'not_reviewed';
      c.review=last?{actor:last.actor,recordedAt:last.recordedAt,comment:last.comment}:null;
      c.canApprove=refs.length>0&&refs.length===c.proofs.length&&c.proofs.every(p=>['passed','reviewable'].includes(p.status)&&['available','reference'].includes(p.availability)&&p.freshness==='current');
      const context=qualification.criteria?.[id];if(context&&refs.length===0){c.contextStatus=context.status;c.contextRole='context_not_acceptance_evidence';c.contextProofs=(context.contextProofIds||[]).map(id=>proofs.find(p=>p.id===id)).filter(Boolean);c.contextReason=context.reason;}
      allCriteria.push(c);if(phase===null)unassigned.push(c);else phases[phase].criteria.push(c);
    }
    if(structured)for(const p of data.phases)for(const c of p.criteria||p.exitCriteria||[])criterion(c,map(p.id),p.id);
    for(const c of data.developmentCriteria||data.criteria||data.requirements||[])criterion(c,Number.isInteger(c.phaseId)?map(c.phaseId):null);
    const revision=hash(Buffer.concat([bytes,Buffer.from(JSON.stringify(proofs.map(p=>({id:p.id,fingerprint:p.fingerprint}))))]));
    const writable=!source.dataPath&&source.writable===true&&raw.developmentReviewSchema===1&&typeof adminId==='string'&&/^[1-9][0-9]{0,18}$/.test(adminId);
    const versions=projectDevelopmentVersions(data,source);
    const view={id,title:source.title||safeText(data.title)||safeText(data.objective)||safeText(data.iterationId)||id,application:source.application||safeText(data.project)||'Application',applicationIds:source.applicationIds,status:safeText(data.status)||safeText(data.state)||'not_reported',versions,sourceHash:hash(bytes),dataPath:source.dataPath||null,sourceModifiedAt:(await stat(source.file)).mtime.toISOString(),mapping:source.phaseMap||null,hasUnqualifiedDelivery:data.delivery?.status==='delivered'&&!source.deliveryEnvironment,iterationId:safeText(data.iterationId)||id,source:source.file,revision,readAt:new Date().toISOString(),currentPhase:current,candidate:{sourceSha:versions.candidate.sourceSha||'',artifactSha256:versions.candidate.artifactSha256||''},nextAction:safeText(data.nextAction),blockers:Array.isArray(data.blockers)?data.blockers:Array.isArray(data.openItems)?data.openItems:[],phases,unassignedCriteria:unassigned,writable,writeReason:writable?'':'Consultation seule : contrat d’écriture non activé dans cette source.',history:reviewHistory,declaredApprovals:Array.isArray(data.approvals)?data.approvals:[],githubObservedAt:data.github?.observedAt||null};
    view.githubObservation=observeGithub(data,source,await readGithubObservations(githubObservationFile));view.iterationKey=source.iterationKey||null;view.unassignedProofs=proofs.filter(p=>p.phaseId===null);view.evidenceQualification={status:qualification.status,observedAt:qualification.observedAt||null};
    return {source,raw,bytes,data,view,proofs,files,criteria:allCriteria,candidateFingerprint};
  }
  async function list(){return Promise.all([...sources.keys()].map(async id=>{try{const {view}=await snapshot(id);return {id,title:view.title,application:view.application,applicationIds:view.applicationIds,status:view.status,versions:view.versions,githubPrUrls:view.githubObservation.pullRequests.map(p=>p.url),githubOpenPrCount:view.githubObservation.pullRequests.filter(p=>p.state==='open').length,hasUnqualifiedDelivery:view.hasUnqualifiedDelivery,blockerCount:view.blockers.length,currentPhase:view.currentPhase,phases:view.phases.map(p=>({id:p.id,label:p.label,status:p.status,criteria:p.criteria.length,approved:p.criteria.filter(c=>c.decision==='approved').length})),nextAction:view.nextAction,readAt:view.readAt};}catch(error){return{id,title:sources.get(id).title||id,applicationIds:sources.get(id).applicationIds,unavailable:true,message:'Source indisponible ou incompatible.'};}}));}
  return {
    list,
    async portfolio(){return developmentPortfolio(applications,await list(),await readGithubObservations(githubObservationFile));},
    async dashboard(){const iterations=await list(),github=await readGithubObservations(githubObservationFile);return{iterations,portfolio:await developmentPortfolio(applications,iterations,github),patrimony:await readPatrimonyObservation(patrimonyObservationFile),githubSnapshot:{status:github.status,observedAt:github.observedAt||null,latestMerges:github.latestMerges||{}},readAt:new Date().toISOString()};},
    async get(id){return (await snapshot(id)).view;},
    async proof(id,proofId){const state=await snapshot(id);const file=state.files.get(proofId);if(!file)fail(404,'Pièce non disponible.');const content=await readFile(file.path);if(hash(content)!==file.hash)fail(409,'La pièce a changé. Actualiser la revue.');return {content,ext:file.ext,name:proofId+file.ext};},
    async review(id,input,actor){
      if(!actor||actor.role!=='global_admin'||!adminId||actor.id!==adminId)fail(403,'Accès interdit.');
      if(!input||Object.keys(input).some(k=>!['revision','criterionId','action','comment','reviewedProofs'].includes(k)))fail(422,'Décision invalide.');
      if(!['approve','request_changes','comment'].includes(input.action)||typeof input.comment!=='string'||input.comment.trim().length<5||input.comment.length>8000)fail(422,'Action et commentaire explicite requis.');
      const initial=await snapshot(id);if(!initial.view.writable)fail(403,'Cette source est en consultation seule.');
      const lockPath=initial.source.file+'.development.lock';let lock;
      try{lock=await open(lockPath,'wx',0o600);}catch{fail(409,'Une écriture est déjà en cours.');}
      let temporary;
      try{
        const current=await snapshot(id);if(input.revision!==current.view.revision)fail(409,'Le suivi ou une preuve a changé. Le brouillon reste à conserver.');
        const c=current.criteria.find(c=>c.id===input.criterionId);if(!c)fail(422,'Critère introuvable.');
        const bindings=c.proofs.map(p=>({id:p.id,fingerprint:p.fingerprint}));
        if(input.action==='approve'&&(!c.canApprove||JSON.stringify(input.reviewedProofs)!==JSON.stringify(bindings)))fail(422,'Examiner toutes les preuves courantes et concluantes avant validation.');
        const event={id:randomUUID(),criterionId:c.id,phaseId:c.phaseId,action:input.action,actor:actor.id,identityProvider:actor.provider,demo:actor.demo===true,recordedAt:new Date().toISOString(),comment:input.comment.trim(),criterionFingerprint:c.fingerprint,candidateFingerprint:current.candidateFingerprint,proofs:bindings,previousRevision:current.view.revision};
        const next={...current.raw,developmentReviews:[...(current.raw.developmentReviews||[]),event]};
        const directory=current.source.file+'.development-backups';await mkdir(directory,{recursive:true,mode:0o700});
        const backup=await open(join(directory,event.id+'.json'),'wx',0o600);try{await backup.writeFile(current.bytes);await backup.sync();}finally{await backup.close();}
        temporary=current.source.file+'.'+randomUUID()+'.tmp';const out=await open(temporary,'wx',0o600);try{await out.writeFile(JSON.stringify(next,null,2)+'\n');await out.sync();}finally{await out.close();}
        if((await snapshot(id)).view.revision!==input.revision)fail(409,'Source modifiée pendant la revue.');
        await rename(temporary,current.source.file);temporary=null;
        return (await snapshot(id)).view;
      }finally{if(temporary)await unlink(temporary).catch(()=>{});await lock.close();await unlink(lockPath).catch(()=>{});}
    },
  };
}
