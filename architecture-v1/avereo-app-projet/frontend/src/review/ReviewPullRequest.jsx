import { reviewPullRequest } from './review-pull-request.mjs';

const dateTime = value => new Date(value).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

export default function ReviewPullRequest({ source, complementary = false, context = '' }) {
  const request = reviewPullRequest(source);
  if (!request) return null;
  return <section className="phase-pull-request" aria-label={complementary ? `Revue complémentaire · PR #${request.number}` : 'Pull request de cette phase'}>
    <div className="pull-request-heading"><strong>{complementary && 'Revue complémentaire · '}PR #{request.number}</strong><span className={`pull-request-state ${request.state}`}>{request.label}</span><a href={request.url} target="_blank" rel="noopener noreferrer">Ouvrir la PR ↗</a></div>
    {complementary && <p>{context} Cette revue complète la phase ; elle ne remplace pas sa PR principale ni sa preuve de validation.</p>}
    <p className="pull-request-repository">{request.repository}</p>
    <dl>
      <div><dt>Dernier constat</dt><dd><time dateTime={request.observedAt}>{dateTime(request.observedAt)}</time></dd></div>
      <div><dt>Révision observée</dt><dd><code title={request.headSha}>{request.headSha.slice(0, 12)}</code></dd></div>
      {request.mergedAt && <div><dt>Fusion consignée</dt><dd><time dateTime={request.mergedAt}>{dateTime(request.mergedAt)}</time></dd></div>}
      {request.mergedBy && <div><dt>Fusion réalisée par</dt><dd>{request.mergedBy}</dd></div>}
      {request.mergeCommitSha && <div><dt>Commit de fusion</dt><dd><code title={request.mergeCommitSha}>{request.mergeCommitSha.slice(0, 12)}</code></dd></div>}
    </dl>
    <p className="pull-request-note">État consigné dans le suivi local, sans synchronisation GitHub. Ouvrir la PR pour vérifier son état actuel. Cette information ne valide pas automatiquement la phase.</p>
  </section>;
}
