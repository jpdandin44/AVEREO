import React, { useEffect, useState } from 'react';
import { SERVER_STORAGE, serverStorage } from './server-store.js';
import { DocumentModal } from './DocumentOrganisation.jsx';
import PdfPreview from './PdfPreview.jsx';
import { PUBLICATION_LIMIT } from '../../../../avereo-platform/shared/report-volumes.js';

const statuses = { pending: 'Word à relire', corrections: 'Corrections demandées', approved: 'Word validés', pdf_ready: 'PDF prêt à publier', published: 'Publié', cancelled: 'Demande retirée', superseded: 'Version remplacée' };
export async function checkedReviewBlob(blob, expected) {
  const hash = Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', await blob.arrayBuffer())), b => b.toString(16).padStart(2, '0')).join('');
  if (blob.size !== (expected.bytes ?? expected.size) || hash !== expected.sha256) throw new Error('Le fichier reçu diffère de la version soumise. Actualisez la revue.');
  return blob;
}

function FinalPdfReader({ item, repository, onClose }) {
  const [url, setUrl] = useState(''), [error, setError] = useState('');
  useEffect(() => {
    let active = true, objectUrl;
    repository.reviewFile(item.id, 'final').then(blob => checkedReviewBlob(blob, item.finalPdf)).then(blob => {
      if (!active) return;
      objectUrl = URL.createObjectURL(blob); setUrl(objectUrl);
    }).catch(e => { if (active) setError(e.message); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [item.id, item.finalPdf?.id, repository]);
  return <DocumentModal title={`Contrôle du PDF final — ${item.reference || item.title}`} onClose={onClose}>
    {error && <p role="alert" className="doc-error">{error}</p>}
    {url ? <><p>Le contenu a été validé sur les Word. Vérifiez ici le rendu du PDF client avant publication.</p><a className="doc-secondary" href={url} download="rapport-client-final.pdf">Télécharger le PDF final</a><PdfPreview url={url} title="PDF client final" /></> : !error && <p role="status">Ouverture du PDF final…</p>}
  </DocumentModal>;
}

export default function ReportReviews({ bienId, repository = serverStorage.repository, online = SERVER_STORAGE, onSaved = async () => {} }) {
  const [state, setState] = useState({ revision: 0, reviews: [] }), [file, setFile] = useState(null), [recipient, setRecipient] = useState(''), [verified, setVerified] = useState(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [notice, setNotice] = useState(''), [reader, setReader] = useState(null), [read, setRead] = useState({});
  const [decision, setDecision] = useState(null), [comment, setComment] = useState(''), [confirmed, setConfirmed] = useState(false);
  const [pdfFile, setPdfFile] = useState(null);
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
    setComment(''); setConfirmed(false); setPdfFile(null);
    const shares = action === 'publish' ? await repository.shares(item.bienId) : null;
    setDecision({ item, action, shares });
  }
  async function decide() {
    const { item, action, shares } = decision;
    if (action === 'preparePdf') await repository.prepareReviewPdf(item.id, pdfFile, item.revision, item.decision.wordSha256.client);
    else await repository.changeReview(item.id, { action, revision: item.revision, comment, confirm: true,
      wordSha256: { client: item.files['rapport-client.docx'].sha256, expert: item.files['rapport-expert.docx'].sha256 },
      ...(shares ? { shareRevision: shares.revision } : {}) });
    setDecision(null); await reload(); await onSaved(); setNotice(action === 'publish' ? 'Le PDF client issu du Word validé est publié. Les Word expert et les remarques restent privés.' : action === 'preparePdf' ? 'PDF final conservé en privé après validation des Word. Contrôlez son rendu puis confirmez la publication.' : 'Décision enregistrée sur les documents Word de cette version.');
  }
  async function downloadSource(item) {
    const blob = await checkedReviewBlob(await repository.reviewFile(item.id, 'source'), item);
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = `${item.reference || 'rapport'}.review.avereo.zip`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function downloadWord(item, kind) {
    const blob = await checkedReviewBlob(await repository.reviewFile(item.id, `word-${kind}`), item.files[`rapport-${kind}.docx`]);
    const url = URL.createObjectURL(blob), link = document.createElement('a');
    link.href = url; link.download = `rapport-${kind}.docx`; link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
    setRead(current => ({ ...current, [`${item.id}:${kind}`]: true }));
  }
  if (!online || !repository.reviews) return bienId ? <p>La relecture experte nécessite l’espace en ligne accessible depuis CONNECT.</p> : null;
  return <section className="documents-panel report-reviews" aria-label={bienId ? 'Relecture experte du bien' : 'Mes revues de rapports'}>
    <header className="documents-heading"><div><h2>{bienId ? 'Relecture experte' : 'Mes revues de rapports'}</h2><p>Demandes privées et décisions sur une version précise, avant publication au client.</p></div><button className="doc-secondary" disabled={busy} onClick={() => run(reload)}>Actualiser les revues</button></header>
    {error && <p role="alert" className="doc-error">{error}</p>}{notice && <p role="status" className="doc-notice">{notice}</p>}
    {bienId && <details className="document-group"><summary>Soumettre une version à relecture</summary>
      <p>Importez la demande préparée dans Rapport. Elle contient les documents Word à relire et une copie complète privée. Le PDF sera préparé après la validation des Word. Aucun document ne rejoint les partages du bien à cette étape.</p>
      <label>Fichier de demande de revue<input type="file" accept=".review.avereo.zip" disabled={busy} onChange={e => {
        const candidate = e.target.files?.[0]; setError(''); setFile(null);
        if (candidate && (!/\.review\.avereo\.zip$/i.test(candidate.name) || candidate.size > PUBLICATION_LIMIT)) setError('Choisissez une demande .review.avereo.zip préparée dans Rapport, dans la limite de 500 Mio.');
        else setFile(candidate || null);
      }} /></label>
      <form className="document-share-form" onSubmit={e => { e.preventDefault(); run(async () => setVerified(await repository.resolveReviewer(bienId, recipient))); }}>
        <label>Compte CONNECT du relecteur<input required maxLength={254} value={recipient} disabled={busy} onChange={e => { setRecipient(e.target.value); setVerified(null); }} placeholder="Votre compte ou celui d’un second expert" /></label>
        <button className="doc-secondary" disabled={busy || !recipient.trim()}>Vérifier le relecteur</button>
      </form>
      {verified && <div className="doc-notice"><p><strong>Relecteur : {verified.label}</strong></p><p>Ce compte pourra télécharger et relire les Word, puis valider cette seule version ou demander des corrections. La copie complète reste réservée au propriétaire.</p><button className="doc-primary" disabled={busy || !file} onClick={() => run(async () => {
        const result = await repository.submitReview(bienId, file, recipient, verified.recipient, state.revision);
        setFile(null); setVerified(null); setRecipient(''); await reload(); setNotice(result.alreadySubmitted ? 'Cette demande est déjà conservée. Aucun doublon créé.' : 'Demande de relecture enregistrée. Le relecteur la retrouve dans « Mes revues de rapports ».');
      })}>Confirmer la demande privée de relecture</button></div>}
    </details>}
    {!state.reviews.length && !error && <p>Aucune revue de rapport pour le moment.</p>}
    <ul className="document-share-list">{state.reviews.map(item => <li key={item.id}><article>
      <h3>{item.reference || item.title} · {item.status === 'approved' && !item.wordApproved ? 'Ancienne validation PDF' : statuses[item.status] || item.status}</h3>
      <p>{item.title} · Relecteur : {item.reviewerLabel} · Déposé par {item.ownerLabel} le {new Date(item.submittedAt).toLocaleString('fr-FR')}</p>
      <p>Version {item.id.slice(0, 8)}{item.isLatest ? ' · dernière version soumise' : ''}</p>
      {item.decision && <p style={{ whiteSpace: 'pre-wrap' }}>Décision {item.decision.basis === 'word' ? 'sur les Word' : 'historique sur PDF'} du {new Date(item.decision.at).toLocaleString('fr-FR')} : {item.decision.comment || 'Validation sans remarque.'}</p>}
      {item.status !== 'cancelled' && <div className="document-actions">{['expert', 'client'].map(kind => <button key={kind} className="doc-secondary" disabled={busy} onClick={() => run(() => downloadWord(item, kind))}>Télécharger le Word {kind} pour relecture</button>)}</div>}
      {item.isOwner && <button className="doc-text" disabled={busy} onClick={() => run(() => downloadSource(item))}>Télécharger la copie privée pour corriger dans Rapport</button>}
      {item.canDecide && <div className="document-actions"><button className="doc-primary" disabled={busy || !read[`${item.id}:expert`] || !read[`${item.id}:client`]} onClick={() => run(() => openDecision(item, 'approve'))}>Valider les Word</button><button className="doc-secondary" disabled={busy} onClick={() => run(() => openDecision(item, 'corrections'))}>Demander des corrections</button><p>Téléchargez et relisez les deux documents dans Word avant de confirmer leur validation. Les corrections métier sont reprises dans Rapport puis soumises à nouveau.</p></div>}
      {item.canPreparePdf && <button className="doc-primary" disabled={busy} onClick={() => run(() => openDecision(item, 'preparePdf'))}>{item.finalPdf ? 'Préparer une nouvelle mise en page PDF' : 'Préparer le PDF après validation Word'}</button>}
      {item.isOwner && item.finalPdf && <button className="doc-secondary" disabled={busy} onClick={() => setReader({ item })}>Contrôler le PDF final</button>}
      {item.canPublish && <button className="doc-primary" disabled={busy} onClick={() => run(() => openDecision(item, 'publish'))}>Publier le PDF client</button>}
      {item.status === 'approved' && !item.wordApproved && <p>Cette ancienne décision portait sur les PDF. Soumettez une nouvelle demande pour valider les documents Word avant de préparer le PDF final.</p>}
      {item.isOwner && item.isLatest && ['pending', 'approved', 'pdf_ready', 'corrections'].includes(item.status) && <button className="doc-text" disabled={busy} onClick={() => run(() => openDecision(item, 'cancel'))}>Retirer cette demande</button>}
    </article></li>)}</ul>
    {reader && <FinalPdfReader {...reader} repository={repository} onClose={() => setReader(null)} />}
    {decision && <DocumentModal title={decision.action === 'approve' ? 'Valider les documents Word ?' : decision.action === 'corrections' ? 'Demander des corrections ?' : decision.action === 'preparePdf' ? 'Préparer le PDF après validation Word ?' : decision.action === 'publish' ? 'Publier le PDF client ?' : 'Retirer cette demande ?'} busy={busy} onClose={() => setDecision(null)}>
      <p><strong>{decision.item.reference || decision.item.title}</strong></p>
      {decision.action === 'publish' ? <><p>Le PDF client issu du Word validé et contrôlé pour sa mise en page rejoint les documents actifs du bien. Les Word, la copie complète et les remarques restent privés. Les versions précédentes ne sont pas écrasées.</p><p>Destinataires actuels : {decision.shares.grants.filter(g => !g.revokedAt).map(g => g.label).join(', ') || 'aucun'}.</p><p>Les futurs destinataires du partage documentaire de ce bien pourront également lire ce PDF.</p></> : decision.action === 'preparePdf' ? <><p>Convertissez le Word client exact validé en PDF, sans modifier son contenu. Vérifiez le contenu, les photos, les tableaux et la pagination dans le PDF obtenu. Une correction du contenu exige une nouvelle version Word à valider.</p><label>PDF client issu du Word validé<input type="file" accept=".pdf,application/pdf" disabled={busy} onChange={e => setPdfFile(e.target.files?.[0] || null)} /></label><p>Le PDF reste privé jusqu’à confirmation de sa publication. Une nouvelle mise en page conserve la précédente dans l’historique.</p></> : decision.action === 'cancel' ? <p>La demande ne pourra plus être validée. Le dossier et son historique seront conservés.</p> : <label>{decision.action === 'corrections' ? 'Corrections demandées : précisez le constat ou la page du Word' : 'Remarques facultatives'}<textarea maxLength={8000} value={comment} onChange={e => setComment(e.target.value)} disabled={busy} /></label>}
      <label><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} disabled={busy} />{decision.action === 'approve' ? 'J’ai relu les documents Word expert et client et je valide leur contenu.' : decision.action === 'preparePdf' ? 'Je confirme avoir converti le Word client validé et contrôlé le contenu et la mise en page du PDF.' : 'Je confirme cette action et son périmètre.'}</label>
      {error && <p role="alert" className="doc-error">{error}</p>}
      <footer><button className="doc-secondary" disabled={busy} onClick={() => setDecision(null)}>Annuler</button><button className="doc-primary" disabled={busy || !confirmed || (decision.action === 'preparePdf' && !pdfFile) || (decision.action === 'corrections' && !comment.trim())} onClick={() => run(decide)}>Confirmer</button></footer>
    </DocumentModal>}
  </section>;
}
