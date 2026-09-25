import { useEffect, useRef, useState } from 'react';
import Markdown from './Markdown.jsx';
import ReviewProgress from './ReviewProgress.jsx';
import ReviewPullRequest from './ReviewPullRequest.jsx';
import { reviewFollowUpPullRequests } from './review-pull-request.mjs';
import { deliveryMessage, phaseProgress } from './review-progress.mjs';
import { createRefreshGate, reconcileDrafts, retainedDocument } from './review-refresh.mjs';

const actions = {
  approve: { label: 'Approuver la phase', description: 'Valider les livrables examinés. La phase suivante attendra son autorisation.' },
  request_changes: { label: 'Demander des corrections', description: 'Renvoyer la phase en préparation et consigner les corrections attendues.' },
  authorize_next: { label: 'Autoriser la phase suivante', description: 'Donner l’accord de passage. Le démarrage sera enregistré séparément.' },
  comment: { label: 'Ajouter une observation', description: 'Conserver une note dans le journal, sans changer le statut de la phase.' },
  submit: { label: 'Soumettre à la revue', description: 'Déclarer les livrables disponibles et demander une nouvelle revue humaine.' },
  start: { label: 'Démarrer la phase', description: 'Enregistrer le démarrage autorisé. Les travaux restent à réaliser.' },
};
const documentKey = file => `${file.path}:${file.sha256}`;
const date = value => value ? new Date(value.length === 10 ? `${value}T12:00:00` : value).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'À venir';

async function api(path, options) {
  const response = await fetch(`/local-review/${path}`, { cache: 'no-store', ...options });
  const body = await response.json().catch(() => ({ error: 'Service local indisponible. Redémarrez le lanceur de revue.' }));
  if (!response.ok) throw new Error(body.error || 'La requête a échoué.');
  return body;
}

export default function ReviewWorkspace() {
  const [view, setView] = useState(null);
  const [selected, setSelected] = useState(null);
  const [docPath, setDocPath] = useState('');
  const [document, setDocument] = useState(null);
  const [sourceMode, setSourceMode] = useState(false);
  const [drafts, setDrafts] = useState({});
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [section, setSection] = useState('livrables');
  const messageRef = useRef(null);
  const viewRef = useRef(null);
  const refreshGate = useRef(createRefreshGate());
  const [syncError, setSyncError] = useState('');
  const [lastSync, setLastSync] = useState(null);

  const acceptView = incoming => {
    const previous = viewRef.current;
    setDrafts(current => reconcileDrafts(current, previous, incoming));
    viewRef.current = incoming;
    setView(incoming);
    setSelected(current => incoming.data.phases.some(p => p.id === current) ? current : incoming.data.currentPhase);
    setLastSync(new Date());
    setSyncError('');
  };
  async function refresh({ background = false } = {}) {
    const ticket = refreshGate.current.beginRead();
    if (ticket === null) return;
    if (!background) { setLoading(true); setError(''); }
    try {
      const incoming = await api('state');
      if (refreshGate.current.accepts(ticket)) acceptView(incoming);
    } catch (failure) {
      if (refreshGate.current.accepts(ticket)) {
        setSyncError(failure.message);
        if (!background) setError(failure.message);
      }
    } finally {
      if (refreshGate.current.accepts(ticket)) setLoading(false);
      refreshGate.current.finishRead(ticket);
    }
  }
  useEffect(() => {
    refresh();
    const updateVisible = () => { if (window.document.visibilityState === 'visible') refresh({ background: true }); };
    const timer = window.setInterval(updateVisible, 25000);
    window.addEventListener('focus', updateVisible);
    window.document.addEventListener('visibilitychange', updateVisible);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', updateVisible);
      window.document.removeEventListener('visibilitychange', updateVisible);
      refreshGate.current.cancelRead();
    };
  }, []);
  const phase = view?.data.phases.find(p => p.id === selected);
  const files = view?.documents.filter(d => d.phaseId === selected) || [];
  const available = view?.actions[selected] || [];
  const draft = drafts[selected] || { comment: '', reviewer: view?.data.owner || '', checks: [], read: [], confirm: false };
  const action = available.includes(draft.action) ? draft.action : ['approve', 'authorize_next', 'start', 'submit', 'comment'].find(a => available.includes(a)) || 'comment';
  const update = patch => setDrafts(current => ({ ...current, [selected]: { ...draft, ...patch } }));
  const choose = id => { setSelected(id); setSection('livrables'); setNotice(''); setError(''); };

  useEffect(() => { setDocPath(current => retainedDocument(current, files)); }, [selected, files.map(f => f.path).join('|')]);
  useEffect(() => { setSourceMode(false); }, [selected]);
  const expectedHash = files.find(f => f.path === docPath)?.sha256;
  useEffect(() => {
    let alive = true; setDocument(null);
    if (docPath && expectedHash) api(`document?path=${encodeURIComponent(docPath)}`).then(result => {
      if (!alive) return;
      if (result.sha256 !== expectedHash) { setError('Ce livrable a changé. Actualisez avant de le relire.'); return; }
      setDocument(result);
    }).catch(failure => { if (alive) setError(failure.message); });
    return () => { alive = false; };
  }, [docPath, expectedHash]);

  const ready = draft.confirm && draft.reviewer.trim() && draft.comment.trim().length >= 5 &&
    (action !== 'approve' || (draft.checks.length === phase?.exitCriteria.length && files.every(f => draft.read.includes(documentKey(f)))));
  async function save(event) {
    event.preventDefault(); if (busy || !ready || !refreshGate.current.beginWrite()) return;
    setBusy(true); setLoading(false); setError(''); setNotice('');
    try {
      const result = await api('actions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Review-Token': view.token }, body: JSON.stringify({ phaseId: selected, revision: view.revision, action, reviewer: draft.reviewer, comment: draft.comment, confirm: draft.confirm, checkedCriteria: draft.checks, reviewedArtifacts: files.map(({ path, sha256 }) => ({ path, sha256 })) }) });
      acceptView(result);
      setDrafts(current => ({ ...current, [selected]: { ...draft, comment: '', confirm: false, checks: [], read: [], action: undefined } }));
      setNotice(result.derivedViews?.status === 'failed' ? result.derivedViews.message : `${actions[action].label} : décision enregistrée sur disque. ${result.derivedViews?.status === 'updated' ? 'Les vues HTML et Markdown sont actualisées.' : ''}`);
      setSection('journal');
    } catch (failure) { setError(failure.message); }
    finally { refreshGate.current.finishWrite(); setBusy(false); messageRef.current?.focus(); }
  }

  if (!view || !phase) return <main className="review-loading"><span className="eyebrow">PROJET · REVUES</span><h1>Connecter le chantier local</h1><p>{loading ? 'Lecture des phases et des livrables…' : error}</p><code>npm.cmd run dev:review</code><button className="primary" onClick={refresh} disabled={loading}>Réessayer</button></main>;
  const { data } = view;
  const phaseView = phaseProgress(view).phases.find(item => item.id === selected);
  const deliveryHint = deliveryMessage(phase, available, files);
  const events = (data.reviewEvents || []).filter(e => e.phaseId === selected).slice().reverse();
  const relevantDecisions = data.decisions.filter(d => d.phaseId === selected || d.blocksPhase === selected + 1);
  const approval = data.decisions.find(d => d.id === phase.validationEvidence?.decisionId);
  const stale = phase.status === 'validated' && approval?.evidence?.reviewedArtifacts && (approval.evidence.reviewedArtifacts.length !== files.length || !approval.evidence.reviewedArtifacts.every(a => files.some(f => f.path === a.path && f.sha256 === a.sha256)));

  return <main className="review-workspace">
    {view.demo && <div className="demo-banner">DÉMONSTRATION — Données fictives. Les décisions de cet espace ne concernent pas le chantier réel.</div>}
    <div className="workspace-heading"><div><span className="eyebrow">PILOTAGE DU CHANTIER</span><h1>Suivre les phases du chantier</h1><p>{data.title}</p></div><div className="heading-actions"><a className="ghost" href="/local-review/export" download>Exporter le suivi ↓</a><button className="ghost" onClick={refresh} disabled={loading || busy}>{loading ? 'Actualisation…' : '↻ Actualiser'}</button></div></div>
    <p className={`sync-status ${syncError ? 'sync-error' : ''}`}>{syncError ? `Actualisation interrompue : ${syncError} Les données affichées peuvent être anciennes ; vos brouillons sont conservés.` : `Actualisation automatique toutes les 25 secondes${lastSync ? ` · dernière lecture à ${lastSync.toLocaleTimeString('fr-FR')}` : ''}.`}</p>
    <ReviewProgress view={view} selected={selected} onSelect={id => { choose(id); requestAnimationFrame(() => window.document.getElementById('phase-review')?.focus()); }} disabled={busy} />
    <div ref={messageRef} tabIndex={-1} className={error ? 'feedback error' : notice ? 'feedback success' : 'feedback empty'} role={error ? 'alert' : 'status'}>{error || notice}</div>
    <div className="review-layout">
      <aside className="phase-sidebar"><div className="sidebar-title">LES PHASES <span>{data.phases.length}</span></div><nav aria-label="Phases du chantier">{data.phases.map(p => <button key={p.id} className={`phase-button ${selected === p.id ? 'selected' : ''}`} disabled={busy} aria-current={selected === p.id ? 'step' : undefined} onClick={() => choose(p.id)}><span className={`phase-number ${p.status}`}>{p.status === 'validated' ? '✓' : String(p.id).padStart(2, '0')}</span><span><b>{p.shortTitle}</b><small>{view.actions[p.id]?.includes('start') && p.status === 'not_started' ? 'Démarrage autorisé' : data.statusLabels[p.status]}</small></span><span className="phase-arrow">›</span></button>)}</nav><div className="sidebar-note"><strong>Ton accord fait avancer le chantier.</strong><p>Approuver un livrable et autoriser la phase suivante sont deux décisions distinctes.</p></div></aside>
      <section id="phase-review" tabIndex={-1} className="phase-content" aria-label={`Revue de la phase ${selected}`}>
        <div className="phase-heading"><span className="eyebrow">PHASE {String(phase.id).padStart(2, '0')}</span><span className={`status-badge ${phase.status}`}>{phaseView.statusLabel}</span><h2>{phase.title}</h2><p>{phase.objective}</p><div className="phase-dates">{phase.authorizedOn && <span>Autorisation <b>{date(phase.authorizedOn)}</b></span>}<span>Début <b>{phase.startedOn ? date(phase.startedOn) : 'Non démarrée'}</b></span><span>Livraison <b>{date(phase.deliveredOn)}</b></span><span>Validation <b>{phase.validatedOn ? date(phase.validatedOn) : 'En attente'}</b></span></div></div>
        <ReviewPullRequest source={phase.pullRequest} />
        {reviewFollowUpPullRequests(data.reviewFollowUps, phase).map(({ request, context }) => <ReviewPullRequest key={`${request.repository.toLowerCase()}#${request.number}`} source={request} complementary context={context} />)}
        <div className="next-step"><span>PROCHAINE ACTION</span><p>{phase.nextAction}</p></div>
        {stale && <p className="feedback error">Un livrable a changé après sa validation. L’accord de passage est bloqué ; demander une nouvelle revue.</p>}
        <div className="section-tabs" role="tablist" aria-label="Contenu de la revue">{[['livrables', 'Livrables'], ['criteres', `Critères · ${phase.exitCriteria.length}`], ['journal', `Journal · ${events.length}`]].map(([id, label]) => <button key={id} id={`tab-${id}`} role="tab" aria-selected={section === id} aria-controls={`panel-${id}`} onClick={() => setSection(id)}>{label}</button>)}</div>
        {section === 'livrables' && <section role="tabpanel" id="panel-livrables" aria-labelledby="tab-livrables" className="deliverable-panel">
          {deliveryHint && <p className="delivery-hint">{deliveryHint}</p>}
          {phaseView.deliverables.map(artifact => <article key={artifact.path} className={`artifact-card ${artifact.available ? 'available' : 'planned'}`}><div className="artifact-line"><span className="file-icon">MD</span><div><h3>{artifact.title}</h3><span className="artifact-status">{artifact.label === 'Prévu' ? 'Prévu · document à produire' : artifact.available ? ['awaiting_review', 'validated'].includes(phase.status) ? 'Disponible pour revue' : 'Document de travail disponible' : artifact.label}</span><code>{artifact.path}</code></div></div>{artifact.description && <p>{artifact.description}</p>}{artifact.expectedEvidence.length > 0 && <div className="artifact-evidence"><h4>Contenu et preuves attendus</h4><ul>{artifact.expectedEvidence.map((item, index) => <li key={index}>{item}</li>)}</ul></div>}{artifact.issue && artifact.label !== 'Prévu' && <p className="unavailable">{artifact.issue}</p>}</article>)}
          {files.length > 0 && <><div className="document-toolbar"><label>Document<select value={docPath} onChange={e => setDocPath(e.target.value)}>{files.map(f => <option key={f.path} value={f.path}>{phaseView.deliverables.find(artifact => artifact.path === f.artifact)?.title || f.path}{f.path !== f.artifact ? ` · ${f.path}` : ''}</option>)}</select></label><button className="text-button" onClick={() => setSourceMode(!sourceMode)}>{sourceMode ? 'Lecture mise en forme' : 'Voir la source'}</button></div><div className="document-reader">{document ? sourceMode ? <pre>{document.content}</pre> : <Markdown source={document.content} /> : <p>Chargement du livrable…</p>}</div>{document && <div className="read-confirmation"><label><input type="checkbox" checked={draft.read.includes(documentKey(document))} onChange={e => update({ read: e.target.checked ? [...draft.read.filter(v => v !== documentKey(document)), documentKey(document)] : draft.read.filter(v => v !== documentKey(document)), confirm: false })} />J’ai examiné cette version du livrable.</label><small title={document.sha256}>Empreinte SHA-256 · {document.sha256.slice(0, 12)}</small></div>}</>}
        </section>}
        {section === 'criteres' && <section role="tabpanel" id="panel-criteres" aria-labelledby="tab-criteres" className="criteria-panel"><h3>Vérifier les critères de sortie</h3><p>Chaque case correspond à ta vérification du livrable. Aucune case n’est cochée automatiquement.</p>{phase.exitCriteria.map((criterion, index) => <label key={index} className="criterion"><input type="checkbox" checked={draft.checks.includes(index)} onChange={e => update({ checks: e.target.checked ? [...draft.checks.filter(v => v !== index), index] : draft.checks.filter(v => v !== index), confirm: false })} /><span><small>CRITÈRE {String(index + 1).padStart(2, '0')}</small>{criterion}</span></label>)}</section>}
        {section === 'journal' && <section role="tabpanel" id="panel-journal" aria-labelledby="tab-journal" className="journal-panel"><h3>Décisions & observations</h3>{events.length === 0 && <p>Aucune décision enregistrée depuis cette interface pour cette phase.</p>}{events.map(event => <article className="journal-event" key={event.id}><span className="journal-dot" /><div><h4>{actions[event.action]?.label || event.action}</h4><small>{event.reviewer} · {new Date(event.recordedAt).toLocaleString('fr-FR')}</small><p>{event.comment}</p><details><summary>Preuve de revue</summary><code>{event.id}</code><ul>{event.reviewedArtifacts.map(file => <li key={file.path}>{file.path}<code>{file.sha256}</code></li>)}</ul></details></div></article>)}{relevantDecisions.length > 0 && <details className="historical-decisions" open><summary>Accords et décisions du suivi</summary>{relevantDecisions.map(d => <div key={d.id}><b>{d.id} · {d.title}</b><p>{d.status === 'approved' ? 'Accord enregistré' : d.status === 'pending' ? 'En attente' : 'Accord remplacé'} · {d.recordedOn ? date(d.recordedOn) : 'sans date'}</p><p>{d.evidence?.quote || d.evidence?.comment || d.nextAction}</p></div>)}</details>}</section>}
      </section>
      <aside className="decision-sidebar"><form onSubmit={save}><fieldset disabled={busy}><span className="eyebrow">TA DÉCISION</span><h2>Faire avancer la revue</h2><label>Action<select value={action} onChange={e => update({ action: e.target.value, confirm: false })}>{available.map(a => <option key={a} value={a}>{actions[a].label}</option>)}</select></label><p className="action-description">{actions[action].description}</p>
        {action === 'approve' && <div className="review-progress"><button type="button" onClick={() => setSection('livrables')}><span>{files.filter(f => draft.read.includes(documentKey(f))).length} / {files.length}</span> livrable(s) examiné(s) →</button><button type="button" onClick={() => setSection('criteres')}><span>{draft.checks.length} / {phase.exitCriteria.length}</span> critères vérifiés →</button></div>}
        <label>Décideur<input value={draft.reviewer} maxLength={100} autoComplete="name" onChange={e => update({ reviewer: e.target.value, confirm: false })} required /></label><label>Commentaire de revue<textarea value={draft.comment} maxLength={8000} minLength={5} rows={5} placeholder={action === 'request_changes' ? 'Préciser les corrections attendues…' : 'Motiver la décision, préciser les réserves ou les limites…'} onChange={e => update({ comment: e.target.value, confirm: false })} required /></label><label className="confirm-decision"><input type="checkbox" checked={draft.confirm} onChange={e => update({ confirm: e.target.checked })} /><span>Je confirme cette décision pour la phase {selected}.</span></label><button className="primary save-decision" disabled={!ready || busy}>{busy ? 'Enregistrement…' : actions[action].label}</button><small className="decision-footnote">Décision conservée avec ton nom, la date et les empreintes des livrables. L’identité est déclarée dans cet espace local.</small></fieldset></form><div className="boundary-note"><strong>Validation du chantier</strong><p>Le commit, la PR, la fusion et la publication gardent leur propre accord. Aucun de ces actes n’est déclenché par les boutons de revue.</p></div></aside>
    </div>
    <footer className="review-footer"><span>Source connectée <code>{view.source}</code></span><span>Révision {view.revision.slice(0, 10)} · actualisée {date(data.updated)}</span></footer>
  </main>;
}
