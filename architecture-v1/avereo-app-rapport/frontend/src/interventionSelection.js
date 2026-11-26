// One selection rule for intervention sections and references in client options.
// The caller supplies normalized actions; this function never changes the dossier.
export function selectClientInterventions(report, actions) {
  const selected = Array.isArray(report.livrable?.observations) ? report.livrable.observations.slice(0, 3) : [];
  const observations = report.observations || [];
  return actions.filter(a => a.inclure_client === true && a.id && actions.filter(row => row.id === a.id).length === 1
    && a.observation_ids.length > 0 && a.observation_ids.every(id => selected.includes(id) && observations.filter(o => o.id === id).length === 1));
}
