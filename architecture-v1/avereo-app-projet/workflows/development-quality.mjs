// Shared read-only counts; no acceptance, live hosting claim or release gate.
export function developmentQuality(view){
  const criteria=[...(view.phases||[]).flatMap(p=>p.criteria||[]),...(view.unassignedCriteria||[])];
  const proofs=[...new Map([...(view.phases||[]).flatMap(p=>p.proofs||[]),...(view.unassignedProofs||[])].map(p=>[p.id,p])).values()];
  return {
    criteria:{total:criteria.length,approved:criteria.filter(c=>c.decision==='approved').length,
      unlinked:criteria.filter(c=>!c.proofIds?.length).length,
      brokenLinks:criteria.filter(c=>c.proofIds?.some(id=>!c.proofs?.some(p=>p.id===id))).length,
      stale:criteria.filter(c=>c.decision==='stale').length,
      changesRequested:criteria.filter(c=>c.decision==='changes_requested').length,
      unassigned:(view.unassignedCriteria||[]).length},
    proofs:{total:proofs.length,available:proofs.filter(p=>p.availability==='available').length,
      external:proofs.filter(p=>p.availability==='reference').length,
      unpublished:proofs.filter(p=>p.availability!=='available'&&p.sourceAvailability==='available').length,
      missing:proofs.filter(p=>!['available','reference'].includes(p.availability)&&p.sourceAvailability!=='available').length,
      stale:proofs.filter(p=>p.freshness==='stale').length,
      unversioned:proofs.filter(p=>!p.sourceSha&&!p.artifactSha256).length,
      undated:proofs.filter(p=>!p.observedAt||!Number.isFinite(Date.parse(p.observedAt))).length}
  };
}

export function applicationQuality(application,iterations){
  const ids=new Set(application.iterations.map(i=>i.id));
  const byId=new Map(iterations.map(i=>[i.id,i]));
  const views=[...ids].map(id=>byId.get(id)).filter(Boolean);
  const known=views.filter(v=>v.quality&&!v.unavailable);
  const total={criteria:{total:0,approved:0,unlinked:0,brokenLinks:0,stale:0,changesRequested:0,unassigned:0},proofs:{total:0,available:0,external:0,unpublished:0,missing:0,stale:0,unversioned:0,undated:0}};
  for(const v of known)for(const group of ['criteria','proofs'])for(const key of Object.keys(total[group]))total[group][key]+=v.quality[group][key]||0;
  return {...total,known:known.length,unknown:Math.max(0,ids.size-known.length),views,blockers:views.reduce((n,v)=>n+(v.blockerCount||0),0)};
}
