// Compare review evidence per phase, independently of unrelated journal changes.
function evidence(view, id, visited = new Set()) {
  const phase = view?.data.phases.find(item => item.id === Number(id));
  if (!phase || visited.has(phase.id)) return null;
  const chain = new Set(visited).add(phase.id);
  return {
    source: view.source,
    status: phase.status,
    criteria: phase.exitCriteria,
    deliverables: phase.deliverables,
    validation: phase.validationEvidence,
    authorization: phase.startEvidence,
    actions: view.actions?.[id],
    documents: (view.documents || []).filter(file => file.phaseId === phase.id).map(({ path, sha256 }) => ({ path, sha256 })),
    issues: (view.issues || []).filter(issue => issue.phaseId === phase.id),
    dependencies: (phase.dependsOn || []).map(dependency => evidence(view, dependency, chain)),
  };
}

export function reconcileDrafts(drafts, previous, incoming) {
  if (!previous) return drafts;
  return Object.fromEntries(Object.entries(drafts).map(([id, draft]) => [id,
    JSON.stringify(evidence(previous, id)) === JSON.stringify(evidence(incoming, id))
      ? draft : { ...draft, checks: [], read: [], confirm: false },
  ]));
}

export function retainedDocument(path, files) {
  return files.some(file => file.path === path) ? path : files[0]?.path || '';
}

// An earlier GET cannot replace a POST result, even if its response arrives later.
// Only one background read is kept in flight; cleanup also invalidates its ticket.
export function createRefreshGate() {
  let generation = 0;
  let reading = null;
  let writing = false;
  return {
    beginRead() {
      if (writing || reading !== null) return null;
      reading = ++generation;
      return reading;
    },
    accepts(ticket) { return ticket !== null && !writing && reading === ticket && generation === ticket; },
    finishRead(ticket) { if (reading === ticket) reading = null; },
    beginWrite() { if (writing) return false; writing = true; reading = null; generation++; return true; },
    finishWrite() { writing = false; },
    cancelRead() { reading = null; generation++; },
  };
}
