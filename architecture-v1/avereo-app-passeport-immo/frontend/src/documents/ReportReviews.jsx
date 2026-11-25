import React, { useEffect, useState } from 'react';
import { SERVER_STORAGE, serverStorage } from './server-store.js';
import { DocumentModal } from './DocumentOrganisation.jsx';
import PdfPreview from './PdfPreview.jsx';
import { PUBLICATION_LIMIT } from '../../../../avereo-platform/shared/report-volumes.js';

const statuses = { pending: 'À relire', corrections: 'Corrections demandées', approved: 'Validé', published: 'Publié', cancelled: 'Demande retirée', superseded: 'Version remplacée' };
export async function checkedReviewBlob(blob, expected) {
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer())), b => b.toString(16).padStart(2, '0')).join('');
  if (blob.size !== (expected.bytes ?? expected.size) || hash !== expected.sha256) throw new Error('Le fichier reçu diffère de la version soumise. Actualisez la revue.');
  return blob;
}

function ReviewReader({ item, kind, repository, onRead, onClose }) {
  const [url, setUrl] = useState(''), [error, setError] = useState('');
  useEffect(() => {
    let active = true, objectUrl;
    repository.reviewFile(item.id, kind).then(blob => checkedReviewBlob(blob, item.files[`rapport-${kind}.pdf`])).then(blob => {
      if (!active) return;
      objectUrl = URL.createObjectURL(blob); setUrl(objectUrl); onRead(item.id, kind);
    }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [item.id, kind, repository]);
  return <DocumentModal title={`PDF ${kind === 'client' ? 'client' : 'expert'} — ${item.reference || item.title}`} onClose={onClose}>
    {error && <p role="alert" className="doc-error">{error}</p>}
    {url ? <><a className="doc-secondary" href={url} download={`rapport-${kind}.pdf`}>Télécharger ce PDF pour le relire</a><PdfPreview url={url} title={`Rapport ${kind}`} /></> : !error && <p role="status">Ouverture de la version de revue…</p>}
  </DocumentModal>;
}

export default function ReportReviews({ bienId, repository = serverStorage.repository, online = SERVER_STORAGE, onSaved = async () => {} }) {
  const [state, setState] = useState({ revision: 0, reviews: [] }), [file, setFile] = useState(null), [recipient, setRecipient] = useState(''), [verified, setVerified] = useState(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState(''), [reader, setReader] = useState(null), [read, setRead] = useState({});
  const [decision, setDecision] = useState(null), [comment, setComment] = useState(''), [confirmed, setConfirmed] = useState(false);
  async function reload() { setState(await repository.reviews(bienId)); }
  useEffect(() => {
    let active = true;
    if (online && repository.reviews) repository.reviews(bienId).then(next => { if (active) setState(next); }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; };
  }, [bienId, repository, online]);
  async function run(action) {
    setBusy(true); setError(''); setNotice('');
    try { await action(); } catch (e) { setError(e.message); if (e.status === 409) await reload().catch(() => {}); } finally { setBusy(false); }
  }
  async function openDecision(item, action) {
    setComment(''); setConfirmed(false);
    const shares = action === 'publish' ? await repository.shares(item.bienId) : null;
    setDecision({ item, action, shares });
  }
  async function decide() {
    const { item, action, shares } = decision;
    await repository.changeReview(item.id, { action, revision: item.revision, comment, confirm: true,
      pdfSha256: { client: item.files['rapport-client.pdf'].sha256, expert: item.files['rapport-expert.pdf'].sha256 },
      ...(shares ? { shareRevision: shares.revision } : {}) });
    setDecision(null); await reload(); await onSaved(); setNotice(action === 'publish' ? 'Le PDF client validé est publié. Les fichiers expert et les remarques restent privés.' : 'Décision enregistrée pour cette version.');
  }
  async function downloadSource(item) {
    const blob = await checkedReviewBlob(await repository.reviewFile(item.id, 'source'), item);
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = `${item.reference || 'rapport'}.review.avereo.zip`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  if (!online || !repository.reviews) return bienId ? <p>La relecture experte nécessite l’espace en ligne accessible depuis CONNECT.</p> : null;
  return <section className="documents-panel report-reviews" aria-label={bienId ? 'Relecture experte du bien' : 'Mes revues de rapports'}>
    <header className="documents-heading"><div><h2>{bienId ? 'Relecture experte' : 'Mes revues de rapports'}</h2><p>Demandes privées et décisions sur une version précise, avant publication au client.</p></div><button className="doc-secondary" disabled={busy} onClick={() => run(reload)}>Actualiser les revues</button></header>
    {error && <p role="alert" className="doc-error">{error}</p>}{notice && <p role="status" className="doc-notice">{notice}</p>}
    {bienId && <details className="document-group"><summary>Soumettre une version à relecture</summary>
      <p>Importez la demande préparée dans Rapport. Elle contient les deux PDF de contrôle et une copie complète privée. Aucun document ne rejoint les partages du bien à cette étape.</p>
      <label>Fichier de demande de revue<input type="file" accept=".review.avereo.zip" disabled={busy} onChange={e => {
        const candidate = e.target.files?.[0]; setError(''); setFile(null);
        if (candidate && (!/\.review\.avereo\.zip$/i.test(candidate.name) || candidate.size > PUBLICATION_LIMIT)) setError('Choisissez une demande .review.avereo.zip préparée dans Rapport, dans la limite de 500 Mio.');
        else setFile(candidate || null);
      }} /></label>
      <form className="document-share-form" onSubmit={e => { e.preventDefault(); run(async () => setVerified(await repository.resolveReviewer(bienId, recipient))); }}>
        <label>Compte CONNECT du relecteur<input required maxLength={254} value={recipient} disabled={busy} onChange={e => { setRecipient(e.target.value); setVerified(null); }} placeholder="Votre compte ou celui d’un second expert" /></label>
        <button className="doc-secondary" disabled={busy || !recipient.trim()}>Vérifier le relecteur</button>
      </form>
      {verified && <div className="doc-notice"><p><strong>Relecteur : {verified.label}</strong></p><p>Ce compte pourra consulter les deux PDF et valider cette seule version ou demander des corrections. La copie complète reste réservée au propriétaire.</p><button className="doc-primary" disabled={busy || !file} onClick={() => run(async () => {
        const result = await repository.submitReview(bienId, file, recipient, verified.recipient, state.revision);
        setFile(null); setVerified(null); setRecipient(''); await reload(); setNotice(result.alreadySubmitted ? 'Cette demande est déjà conservée. Aucun doublon créé.' : 'Demande de relecture enregistrée. Le relecteur la retrouve dans « Mes revues de rapports ».');
      })}>Confirmer la demande privée de relecture</button></div>}
    </details>}
    {!state.reviews.length && !error && <p>Aucune revue de rapport pour le moment.</p>}
    <ul className="document-share-list">{state.reviews.map(item => <li key={item.id}><article>
      <h3>{item.reference || item.title} · {statuses[item.status] || item.status}</h3>
      <p>{item.title} · Relecteur : {item.reviewerLabel} · Déposé par {item.ownerLabel} le {new Date(item.submittedAt).toLocaleString('fr-FR')}</p>
      <p>Version {item.id.slice(0, 8)}{item.isLatest ? ' · dernière version soumise' : ''}</p>
      {item.decision && <p style={{ whiteSpace: 'pre-wrap' }}>Décision du {new Date(item.decision.at).toLocaleString('fr-FR')} : {item.decision.comment || 'Validation sans remarque.'}</p>}
      {item.status !== 'cancelled' && <div className="document-actions">{['expert', 'client'].map(kind => <button key={kind} className="doc-secondary" disabled={busy} onClick={() => setReader({ item, kind })}>Relire le PDF {kind}</button>)}</div>}
      {item.isOwner && <button className="doc-text" disabled={busy} onClick={() => run(() => downloadSource(item))}>Télécharger la copie privée pour corriger dans Rapport</button>}
      {item.canDecide && <div className="document-actions"><button className="doc-primary" disabled={busy || !read[`${item.id}:expert`] || !read[`${item.id}:client`]} onClick={() => run(() => openDecision(item, 'approve'))}>Valider cette version</button><button className="doc-secondary" disabled={busy} onClick={() => run(() => openDecision(item, 'corrections'))}>Demander des corrections</button><p>Ouvrez les deux PDF avant de confirmer leur validation.</p></div>}
      {item.isOwner && item.isLatest && item.status === 'approved' && <button className="doc-primary" disabled={busy} onClick={() => run(() => openDecision(item, 'publish'))}>Publier le PDF client validé</button>}
      {item.isOwner && item.isLatest && ['pending', 'approved', 'corrections'].includes(item.status) && <button className="doc-text" disabled={busy} onClick={() => run(() => openDecision(item, 'cancel'))}>Retirer cette demande</button>}
    </article></li>)}</ul>
    {reader && <ReviewReader {...reader} repository={repository} onRead={(id, kind) => setRead(current => ({ ...current, [`${id}:${kind}`]: true }))} onClose={() => setReader(null)} />}
    {decision && <DocumentModal title={decision.action === 'approve' ? 'Valider cette version ?' : decision.action === 'corrections' ? 'Demander des corrections ?' : decision.action === 'publish' ? 'Publier le PDF client validé ?' : 'Retirer cette demande ?'} busy={busy} onClose={() => setDecision(null)}>
      <p><strong>{decision.item.reference || decision.item.title}</strong></p>
      {decision.action === 'publish' ? <><p>Le PDF client exact validé rejoint les documents actifs du bien. Les fichiers expert, la copie complète et les remarques restent privés. Les versions précédentes ne sont pas écrasées.</p><p>Destinataires actuels : {decision.shares.grants.filter(g => !g.revokedAt).map(g => g.label).join(', ') || 'aucun'}.</p><p>Les futurs destinataires du partage documentaire de ce bien pourront également lire ce PDF.</p></> : decision.action === 'cancel' ? <p>La demande ne pourra plus être validée. Le dossier et son historique seront conservés.</p> : <label>{decision.action === 'corrections' ? 'Corrections demandées : précisez le constat ou la page' : 'Remarques facultatives'}<textarea maxLength={8000} value={comment} onChange={e => setComment(e.target.value)} disabled={busy} /></label>}
      <label><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} disabled={busy} />{decision.action === 'approve' ? 'J’ai relu les PDF expert et client et je valide cette version.' : 'Je confirme cette action et son périmètre.'}</label>
      {error && <p role="alert" className="doc-error">{error}</p>}
      <footer><button className="doc-secondary" disabled={busy} onClick={() => setDecision(null)}>Annuler</button><button className="doc-primary" disabled={busy || !confirmed || (decision.action === 'corrections' && !comment.trim())} onClick={() => run(decide)}>Confirmer</button></footer>
    </DocumentModal>}
  </section>;
}
