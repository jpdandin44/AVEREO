// Projection consultative : ne modifie jamais les phases ni les décisions sources.
export const PHASE_LABELS=['Cadrage','Développement local','Préproduction','Mise en production'];
const sha=v=>typeof v==='string'&&/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(v);
const date=v=>typeof v==='string'&&/^\d{4}-\d{2}-\d{2}(?:T|$)/.test(v)&&Number.isFinite(Date.parse(v))&&new Date(v.slice(0,10)+'T00:00:00Z').toISOString().slice(0,10)===v.slice(0,10)?v:null;
export function observationFreshness(value,now=Date.now(),maxAgeMs=86400000){
  const timestamp=date(value),age=timestamp?now-Date.parse(timestamp):null;
  return !timestamp?'unknown':age< -300000?'invalid':age>maxAgeMs?'stale':'current';
}
function sameVersion(proof,candidate){
  const pairs=[['sourceSha',sha],['artifactSha256',v=>typeof v==='string'&&/^[a-f0-9]{64}$/i.test(v)]];
  let bound=false;
  for(const [key,valid]of pairs){
    if(valid(candidate?.[key])&&valid(proof[key])){if(candidate[key]!==proof[key])return false;bound=true;}
  }
  return bound;
}
const historicalProof=(proof,candidate)=>proof.freshness==='stale'||['sourceSha','artifactSha256'].some(k=>sha(proof[k])&&sha(candidate[k])&&proof[k]!==candidate[k]);
export function technicalProofState(proof,candidate,phaseId,now=Date.now()){
  if(!proof||proof.freshness!=='current'||!sameVersion(proof,candidate)||!date(proof.observedAt)||Date.parse(proof.observedAt)>now+300000)return 'unknown';
  if(proof.referenceQualification?.role==='context_not_acceptance_evidence')return 'unknown';
  const publisherVerified=proof.availability==='unavailable'&&proof.sourceAvailability==='available'&&/^[a-f0-9]{64}$/i.test(proof.fileHash||'');
  if(!['available','reference'].includes(proof.availability)&&!publisherVerified||!String(proof.url||proof.description||'').trim())return 'unknown';
  if(phaseId>=2&&(!String(proof.target||'').trim()||proof.kind!==['','','preproduction','production'][phaseId]))return 'unknown';
  if(['failed','failure','error'].includes(proof.status))return 'failed';
  return proof.status==='passed'?'evidenced':'pending';
}
export function projectDevelopmentProgress(view,{now=Date.now()}={}){
  if(!view||view.unavailable||!Array.isArray(view.phases))return null;
  const candidate=view.candidate||{},github=view.githubObservation||{};
  const phases=PHASE_LABELS.map((label,id)=>{
    const source=view.phases.find(p=>p.id===id)||{},proofs=source.proofs||[],criteria=Array.isArray(source.criteria)?source.criteria:[];
    const linked=new Set(criteria.flatMap(c=>c.proofIds||[]));
    const steps=criteria.map(c=>{
      const refs=c.proofIds||[],attached=c.proofs||[],states=attached.map(p=>technicalProofState(p,candidate,id,now));
      const status=states.includes('failed')?'failed':refs.length>0&&refs.length===attached.length&&states.every(s=>s==='evidenced')?'evidenced':states.includes('unknown')||!refs.length?'unknown':'pending';
      return{id:'criterion:'+c.id,title:c.title,status,kind:'criterion',humanDecision:c.decision||'not_reviewed',proofs:attached};
    });
    const historical=proofs.filter(p=>!linked.has(p.id)&&historicalProof(p,candidate)).length;
    for(const proof of proofs)if(!linked.has(proof.id)&&!historicalProof(proof,candidate)&&['local','ci','documentation','preproduction','production'].includes(proof.kind))steps.push({id:'proof:'+proof.id,title:proof.title,status:technicalProofState(proof,candidate,id,now),kind:'check',proofs:[proof]});
    // Les contrôles GitHub concernent uniquement la tête exacte, pas une livraison.
    if(id===1&&observationFreshness(github.observedAt,now)==='current')for(const pr of github.pullRequests||[]){
      if(pr.status!=='observed'||!sha(candidate.sourceSha)||pr.headSha!==candidate.sourceSha)continue;
      for(const [index,check]of (pr.checks||[]).entries()){
        if(check.name==='PR Policy')continue; // Attestation humaine distincte du résultat technique.
        const passed=check.status==='completed'&&check.conclusion==='success';
        const failed=check.status==='completed'&&['failure','timed_out','action_required'].includes(check.conclusion);
        steps.push({id:'github:'+pr.url+':'+index,title:'CI GitHub — '+check.name,kind:'ci',status:passed?'evidenced':failed?'failed':'pending',proofs:[],observedAt:github.observedAt,url:check.url});
      }
    }
    const evidenced=steps.filter(s=>s.status==='evidenced').length,failed=steps.filter(s=>s.status==='failed').length,unknown=steps.filter(s=>s.status==='unknown').length;
    const dates=proofs.filter(p=>technicalProofState(p,candidate,id,now)==='evidenced').map(p=>date(p.observedAt)).filter(Boolean).concat(steps.filter(s=>s.status==='evidenced'&&s.observedAt).map(s=>s.observedAt)).sort((a,b)=>Date.parse(a)-Date.parse(b));
    const start=date(source.plan?.start),end=date(source.plan?.end);
    const plan=start&&end&&Date.parse(end)>=Date.parse(start)?{start,end}:null;
    return{id,label,declaredStatus:source.status||'not_reported',status:failed?'blocked':steps.length&&evidenced===steps.length?'evidenced':evidenced?'partial':'not_evidenced',steps,total:steps.length,evidenced,failed,unknown,historical,remaining:steps.length-evidenced,
      approved:criteria.filter(c=>c.decision==='approved').length,humanRemaining:criteria.filter(c=>c.decision!=='approved').length,
      evidenceStart:dates[0]||null,evidenceEnd:dates.at(-1)||null,plan};
  });
  const observed=phases.filter(p=>p.evidenced>0),technicalPhase=observed.at(-1)?.id??null;
  return{phases,declaredPhase:view.currentPhase??null,technicalPhase,phaseDiscrepancy:technicalPhase!==null&&view.currentPhase!==technicalPhase,
    evidenced:phases.reduce((n,p)=>n+p.evidenced,0),remaining:phases.reduce((n,p)=>n+p.remaining,0),unknown:phases.reduce((n,p)=>n+p.unknown,0),
    humanRemaining:phases.reduce((n,p)=>n+p.humanRemaining,0)+(view.unassignedCriteria||[]).filter(c=>c.decision!=='approved').length,unassigned:(view.unassignedCriteria||[]).length,unquantifiedPhases:phases.filter(p=>!p.total).length,
    githubFreshness:observationFreshness(github.observedAt,now),sourceUpdatedAt:view.versions?.updatedAt||null};
}
export function timelineBounds(progresses,now=Date.now()){
  const values=progresses.flatMap(p=>p?.phases.flatMap(s=>[s.evidenceStart,s.evidenceEnd,s.plan?.start,s.plan?.end])||[]).filter(Boolean).map(Date.parse);
  const today=new Date(now);today.setUTCHours(0,0,0,0);
  const start=Math.min(today.getTime()-7*86400000,...values),end=Math.max(today.getTime()+28*86400000,...values);
  return{start,end,position:v=>Math.max(0,Math.min(100,(Date.parse(v)-start)/(end-start)*100))};
}
