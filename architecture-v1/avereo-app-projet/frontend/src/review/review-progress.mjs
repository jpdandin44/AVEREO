// Read-only presentation of the connected review snapshot. Counts describe
// recorded phase milestones; they never estimate work or authorize a transition.
export function phaseProgress(view) {
  const { data, documents = [], issues = [], actions = {} } = view;
  const phases = (data.phases || []).map(phase => {
    const files = documents.filter(file => file.phaseId === phase.id);
    const deliverables = (phase.deliverables || []).map(artifact => {
      const matching = files.filter(file => file.artifact === artifact.path);
      const issue = issues.find(item => item.phaseId === phase.id && item.path === artifact.path);
      const available = matching.length > 0 && !issue;
      return {
        path: artifact.path,
        title: typeof artifact.title === 'string' && artifact.title.trim() ? artifact.title : artifact.path,
        description: typeof artifact.description === 'string' ? artifact.description : '',
        expectedEvidence: Array.isArray(artifact.expectedEvidence) ? artifact.expectedEvidence.filter(item => typeof item === 'string' && item.trim()) : [],
        available,
        documentCount: matching.length,
        label: available ? 'Disponible' : matching.length ? 'Incomplet' : artifact.availability === 'planned' && (!issue || issue.message === 'Livrable non disponible') ? 'Prévu' : 'Indisponible',
        issue: issue?.message || null,
      };
    });
    const explicitBlockers = Array.isArray(phase.blockers) ? phase.blockers : typeof phase.blockers === 'string' ? [phase.blockers] : [];
    const blockers = explicitBlockers.map(blocker => typeof blocker === 'string' ? blocker : blocker?.message || blocker?.title).filter(Boolean);
    for (const decision of data.decisions || []) {
      if (decision.status === 'pending' && decision.blocksPhase === phase.id) blockers.push(`${decision.id} · ${decision.title}`);
    }
    return {
      ...phase,
      current: phase.id === data.currentPhase,
      statusLabel: phase.status === 'not_started' && actions[phase.id]?.includes('start') ? 'Démarrage autorisé' : data.statusLabels?.[phase.status] || 'Statut non renseigné',
      deliverables,
      availableDeliverables: deliverables.filter(artifact => artifact.available).length,
      blockers: [...new Set(blockers)],
    };
  });
  return {
    phases,
    total: phases.length,
    approved: phases.filter(phase => phase.status === 'validated').length,
    delivered: phases.filter(phase => Boolean(phase.deliveredOn)).length,
    awaitingReview: phases.filter(phase => phase.status === 'awaiting_review').length,
    ready: phases.filter(phase => phase.status === 'not_started' && actions[phase.id]?.includes('start')),
    current: phases.find(phase => phase.current) || null,
  };
}

export function priorApprovalSummary(priorApprovals) {
  const entries = Array.isArray(priorApprovals?.entries) ? priorApprovals.entries.filter(entry => ['approval', 'authorization'].includes(entry.kind)) : [];
  return {
    entries,
    approvedPhases: new Set(entries.filter(entry => entry.kind === 'approval').map(entry => entry.phaseId)).size,
    authorizedPhases: new Set(entries.filter(entry => entry.kind === 'authorization').map(entry => entry.phaseId)).size,
  };
}

export function recentActivity(data) {
  return (data.history || []).filter(entry => !entry.reviewId && entry.event).slice(-5).reverse();
}

export function phaseDate(value, fallback = 'Non renseignée') {
  if (typeof value !== 'string' || !value) return fallback;
  const parsed = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(parsed.getTime()) ? fallback : parsed.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function deliveryMessage(phase, availableActions, files) {
  if (files.length) return '';
  if (!phase.deliverables?.length) return 'Les livrables de cette phase restent à définir dans le suivi du chantier.';
  if (phase.status === 'not_started' && availableActions.includes('start')) return 'Le démarrage est autorisé. Les livrables ci-dessous sont prévus ; leurs documents seront consultables dès leur production.';
  if (phase.status === 'not_started') return 'Les livrables ci-dessous sont prévus pour cette phase. Leurs documents seront consultables dès leur production ; l’autorisation de démarrage reste à vérifier.';
  if (phase.status === 'in_progress') return 'Les travaux ont commencé. Les documents prévus apparaîtront ici dès leur production.';
  if (phase.status === 'blocked') return 'La phase est bloquée. Consulter les points à suivre ; aucun document de livraison n’est actuellement disponible.';
  return 'Une livraison est enregistrée, mais ses documents ne sont pas disponibles. Vérifier les chemins et les fichiers du chantier avant toute nouvelle décision.';
}
