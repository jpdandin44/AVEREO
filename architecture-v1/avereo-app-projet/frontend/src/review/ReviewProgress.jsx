import { phaseDate, phaseProgress, priorApprovalSummary, recentActivity } from './review-progress.mjs';

function PriorApprovals({ source }) {
  const prior = priorApprovalSummary(source);
  if (!prior.entries.length) return null;
  return <details className="prior-approvals">
    <summary><strong>Validations déjà acquises</strong><span>{prior.approvedPhases} phase(s) validée(s) · {prior.authorizedPhases} autorisation(s) de phase</span></summary>
    <div className="prior-approvals-body"><p className="prior-source">Source : <strong>{source.sourceProject}</strong> · consultée le {phaseDate(source.observedAt)}</p><p>Les accords du chantier source sont conservés ici avec leurs remarques. Ils ne modifient pas les statuts du chantier courant.</p>
      <ol className="prior-approval-list">{prior.entries.map(entry => <li key={entry.id}><div className="prior-entry-heading"><strong>{entry.id} · {entry.kind === 'approval' ? 'Validation acquise' : 'Démarrage autorisé'}</strong><span>Phase {entry.phaseId}</span></div><h3>{entry.phaseTitle}</h3><small>{entry.reviewer || 'Décideur non renseigné'} · {phaseDate(entry.recordedAt || entry.recordedOn)}</small><p>{entry.comment || 'Commentaire non renseigné dans la source.'}</p><small className="prior-proof">{entry.evidenceStatus === 'verified' ? 'Preuve de revue vérifiée' : entry.evidenceStatus === 'message_reference' ? 'Référence à un message conservée' : 'Référence historique conservée'}{entry.reviewId ? ` · ${entry.reviewId}` : ''}</small></li>)}</ol>
      <details className="prior-provenance"><summary>Consulter la provenance</summary><p>Fichier source</p><code>{source.sourcePath}</code>{source.sourceSha256 && <><p>Empreinte du suivi consulté</p><code>{source.sourceSha256}</code></>}</details>
    </div>
  </details>;
}

export default function ReviewProgress({ view, selected, onSelect, disabled }) {
  const progress = phaseProgress(view);
  const activity = recentActivity(view.data);
  return <section className="progress-dashboard" aria-label="Progression du chantier">
    <div className="overview-grid">
      <div className="metric milestone-metric"><span>Phases livrées</span><strong>{progress.delivered}<small> / {progress.total}</small></strong><progress aria-label="Nombre de phases livrées" value={progress.delivered} max={Math.max(1, progress.total)} /><p>Au moins une remise enregistrée</p></div>
      <div className="metric milestone-metric"><span>Phases validées</span><strong>{progress.approved}<small> / {progress.total}</small></strong><progress aria-label="Nombre de phases validées" value={progress.approved} max={Math.max(1, progress.total)} /><p>Avec un accord humain enregistré</p></div>
      <div className="metric current-metric"><span>Phase courante</span><strong>{progress.current ? `Phase ${progress.current.id}` : 'Non définie'}</strong><p className="current-phase-title">{progress.current?.shortTitle}</p><p>{progress.current?.statusLabel}</p></div>
      <div className="metric"><span>À valider maintenant</span><strong>{progress.awaitingReview}<small> phase(s)</small></strong><p>En attente de revue humaine</p></div>
    </div>
    <div className="progress-caption"><h2>Parcours des phases</h2><p>La livraison et la validation sont suivies séparément. L’avancement des travaux n’est pas chiffré.</p></div>
    {progress.ready.length > 0 && <div className="ready-phases"><span>Prêt à démarrer</span>{progress.ready.map(phase => <button type="button" disabled={disabled} key={phase.id} onClick={() => onSelect(phase.id)}>Phase {phase.id} · {phase.shortTitle} →</button>)}<small>L’autorisation est enregistrée ; le démarrage reste une action distincte.</small></div>}
    <ol className="phase-timeline" aria-label="Avancement de chaque phase">
      {progress.phases.map(phase => <li className={`timeline-phase ${phase.status} ${phase.current ? 'current' : ''} ${selected === phase.id ? 'selected' : ''}`} key={phase.id}>
        <div className="timeline-topline"><span>PHASE {String(phase.id).padStart(2, '0')}</span>{phase.current && <b>En cours de suivi</b>}</div>
        <button type="button" className="timeline-select" disabled={disabled} aria-label={`Voir la phase ${phase.id} : ${phase.shortTitle}`} aria-current={selected === phase.id ? 'step' : undefined} onClick={() => onSelect(phase.id)}><strong>{phase.shortTitle || phase.title}</strong><span aria-hidden="true">↗</span></button>
        <span className={`timeline-status ${phase.status}`}>{phase.status === 'validated' && <span aria-hidden="true">✓ </span>}{phase.statusLabel}</span>
        <dl className="timeline-dates">{phase.authorizedOn && <div><dt>Autorisation</dt><dd>{phaseDate(phase.authorizedOn)}</dd></div>}<div><dt>Début</dt><dd>{phaseDate(phase.startedOn, 'Non démarrée')}</dd></div><div><dt>Livraison</dt><dd>{phaseDate(phase.deliveredOn, 'Non remise')}</dd></div><div><dt>Validation</dt><dd>{phaseDate(phase.validatedOn, 'En attente')}</dd></div></dl>
        <p className="timeline-availability">{phase.deliverables.length ? `${phase.availableDeliverables} / ${phase.deliverables.length} livrable(s) disponible(s)` : 'Aucun livrable défini'}</p>
        <details className="timeline-details" open={phase.current}>
          <summary>Action et points à suivre{phase.blockers.length > 0 && <span className="blocker-count">{phase.blockers.length} en attente</span>}</summary>
          <h3>Prochaine action</h3><p>{phase.nextAction || 'Prochaine action à préciser.'}</p>
          <h3>Blocages renseignés</h3>{phase.blockers.length > 0 ? <ul className="timeline-blockers">{phase.blockers.map(blocker => <li key={blocker}>{blocker}</li>)}</ul> : <p>{phase.status === 'blocked' ? 'Motif du blocage non renseigné.' : 'Aucun blocage renseigné.'}</p>}
          {phase.deliverables.length > 0 && <><h3>Livrables</h3><ul className="timeline-deliverables">{phase.deliverables.map(artifact => <li key={artifact.path}><span>{artifact.title}</span><b className={artifact.available ? 'available' : ''}>{artifact.label}</b>{artifact.issue && artifact.label !== 'Prévu' && <small>{artifact.issue}</small>}</li>)}</ul></>}
        </details>
      </li>)}
    </ol>
    <PriorApprovals source={view.data.priorApprovals} />
    {activity.length > 0 && <details className="progress-activity"><summary><strong>Dernières actions consignées</strong><span>Dernière entrée le {phaseDate(activity[0].date)}</span></summary><ol>{activity.map((entry, index) => <li key={`${entry.date}:${index}`}><span>{phaseDate(entry.date)}</span><p>{entry.event}</p></li>)}</ol><p className="activity-note">Les décisions humaines restent consultables dans le journal de chaque phase.</p></details>}
  </section>;
}
