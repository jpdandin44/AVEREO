import { useReadOnlyMode } from './ReadOnlyFields.jsx';
import React, { useEffect, useRef, useState } from 'react';
import { PLAN_KINDS, markersForPlan, planKindLabel, readPlanFile, removePlan, setObservationPoint } from './observationPlans.js';
import { orderedObservations, observationNumber } from './observationOrder.js';
import CadastralCapture from './CadastralCapture.jsx';
import { attachPlanViews, captureTarget } from './cadastralCapture.js';
import './observationPlans.css';

export default function ObservationPlans({ report, setReport, selectedId, onSelect, onShowObservation, focusRequest, onPhotoTransfer }) {
  const readOnly = useReadOnlyMode();
  const [viewId, setViewId] = useState('');
  const [zoom, setZoom] = useState(100);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [importKind, setImportKind] = useState('auto'), [importedIds, setImportedIds] = useState([]);
  const [removeId, setRemoveId] = useState('');
  const [dragPoint, setDragPoint] = useState(null);
  const stageRef = useRef(null), dragRef = useRef(null), suppressClick = useRef(false), latestReport = useRef(report);
  latestReport.current = report;
  const plans = report.plans || [];
  const ordered = orderedObservations(report);
  const observation = ordered.find(o => o.id === selectedId) || ordered[0];
  const plan = plans.find(p => p.id === viewId) || plans.find(p => observation?.reperes?.some(point => point.planId === p.id)) || plans[0];
  const number = observationNumber(report, observation);
  const markers = plan ? markersForPlan(report, plan.id) : [];
  const current = markers.find(p => p.observationId === observation?.id);
  useEffect(() => {
    if (!focusRequest) return;
    if (focusRequest.planId && plans.some(view => view.id === focusRequest.planId)) {
      setViewId(focusRequest.planId); setZoom(100); setPlacing(false); return;
    }
    const selected = report.observations.find(o => o.id === selectedId);
    if (selected?.reperes?.some(p => p.planId === plan?.id)) return;
    const point = selected?.reperes?.find(p => plans.some(view => view.id === p.planId));
    if (point) { setViewId(point.planId); setZoom(100); setPlacing(false); }
  }, [focusRequest]);
  const choosePlan = id => { setViewId(id); setZoom(100); setPlacing(false); setMessage(''); setRemoveId(''); };
  const chooseObservation = id => { onSelect(id); setPlacing(false); setMessage(''); };
  const pointAt = event => {
    const rect = stageRef.current.getBoundingClientRect();
    return { x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) };
  };
  const place = (id, point) => {
    if (readOnly || !id || !plan) return;
    setReport(previous => setObservationPoint(previous, id, plan.id, point));
    setMessage(point ? 'Repère mis à jour dans le dossier.' : 'Repère retiré de cette vue.');
  };
  const importPlans = async event => {
    const files = Array.from(event.target.files || []); event.target.value = '';
    if (!files.length || busy || readOnly) return;
    const target = captureTarget(report);
    setError(''); setBusy(true); setImportedIds([]); onPhotoTransfer?.(1);
    try {
      const imported = [];
      for (const file of files) imported.push(await readPlanFile(file, importKind));
      const previous = latestReport.current;
      if (captureTarget(previous) !== target) return;
      attachPlanViews(previous, imported, target);
      setReport(current => { try { return attachPlanViews(current, imported, target); } catch { return current; } });
      setImportedIds(imported.map(view => view.id)); choosePlan(imported[0].id); setMessage('');
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); onPhotoTransfer?.(-1); }
  };
  const updatePlan = patch => { if (!readOnly) setReport(previous => ({ ...previous, plans: previous.plans.map(p => p.id === plan.id ? { ...p, ...patch } : p) })); };
  const deleteView = () => {
    if (readOnly || busy || removeId !== plan.id) return;
    setReport(previous => removePlan(previous, removeId)); choosePlan(''); setImportedIds([]); setMessage('Vue retirée ; observations conservées.');
  };
  return <section className="observation-plans" id="observation-plans" data-disclosure-busy={busy || Boolean(dragPoint)} tabIndex={-1} aria-label="Plans et vues du dossier">
    <h3>Repérer une observation</h3>
    <p>Choisissez une observation et une vue, puis placez son repère. Le même numéro suit le constat sur chaque vue et dans le Word.</p>
    <CadastralCapture report={report} setReport={setReport} onPhotoTransfer={onPhotoTransfer} onAdded={choosePlan} />
    <details className="plan-import-panel"><summary>Importer des plans</summary>
      <div className="plan-toolbar"><label>Type des vues importées<select value={importKind} onChange={event => setImportKind(event.target.value)} disabled={busy}>
        <option value="auto">Déduire du nom du fichier, puis vérifier</option>
        {Object.entries(PLAN_KINDS).map(([kind, label]) => <option key={kind} value={kind}>{label}</option>)}
      </select></label>
      <label className="plan-import">Choisir une ou plusieurs images<input type="file" multiple accept="image/png,image/jpeg" onChange={importPlans} disabled={busy} /></label></div>
      <p className="muted">PNG ou JPEG, 4 Mio par image. Les vues sont conservées dans ce dossier.</p>
    </details>
    {busy && <p role="status">Lecture des images…</p>}
    {error && <p role="alert" className="error-text">{error}</p>}
    {importedIds.length > 0 && <p role="status">{importedIds.every(id => plans.some(view => view.id === id))
      ? `${importedIds.length} vue(s) ajoutée(s) à la bibliothèque.` : 'Les vues n’ont pas été ajoutées car le dossier a changé. Réessayez.'}</p>}
    {!plan ? <p>Aucune vue ajoutée. Vous pouvez continuer à décrire la pièce ou la zone dans chaque observation.</p> : <>
      <div className="plan-workspace">
      <nav className="plan-library" aria-label="Vues du dossier">
        {[['Terrain et implantation', ['cadastre', 'satellite', 'satellite_parcelles', 'masse']], ['Bâti et autres vues', ['niveau', 'coupe', 'facade', 'autre']]].map(([label, kinds]) => {
          const group = plans.filter(view => kinds.includes(view.kind));
          return group.length > 0 && <div key={label}><h4>{label}</h4>{group.map(view => <button data-readonly-view type="button" key={view.id}
            aria-pressed={view.id === plan.id} onClick={() => choosePlan(view.id)}><strong>{view.title}</strong>
            <span>{planKindLabel(view.kind)} · {markersForPlan(report, view.id).length} repère(s)</span></button>)}</div>;
        })}
      </nav>
      <div className="plan-view">
      <h4 className="plan-view-title">{plan.title}</h4><p className="muted">{planKindLabel(plan.kind)} · Repérage indicatif, sans mesure automatique.</p>
      <div className="plan-toolbar">
        <label>Observation à repérer<select data-readonly-view value={observation?.id || ''} onChange={e => chooseObservation(e.target.value)}>
          {ordered.map(o => <option key={o.id} value={o.id}>{observationNumber(report, o)}. {o.titre || o.piece || 'Sans titre'}</option>)}
        </select></label>
        <label>Zoom {zoom} %<input data-readonly-view type="range" min="100" max="300" step="25" value={zoom} onChange={e => setZoom(Number(e.target.value))} /></label>
      </div>
      <div className="plan-actions">
        <button type="button" className={`button ${placing ? 'primary' : 'secondary'}`} aria-pressed={placing}
          disabled={!observation || readOnly} onClick={() => setPlacing(!placing)}>{placing ? 'Annuler le placement' : current ? 'Déplacer le repère' : 'Placer le repère'}</button>
        {current && <button type="button" className="button ghost" onClick={() => place(observation.id, null)}>Retirer ce repère</button>}
        {observation && <button type="button" className="button ghost" data-readonly-view onClick={() => onShowObservation(observation.id)}>Voir la fiche {number}</button>}
      </div>
      <p className="plan-instruction" role="status">{placing ? `Cliquez ou touchez la vue pour placer le repère ${number}.` : 'Sélectionnez un repère pour retrouver sa fiche. Déplacez-le par glissement ou avec les flèches du clavier.'}</p>
      <div className="plan-scroll">
        <div ref={stageRef} className={`plan-stage${placing ? ' is-placing' : ''}`} style={{ width: `${zoom}%` }} tabIndex={placing ? 0 : -1}
          aria-label={placing ? 'Zone de placement : Entrée pour poser le repère au centre, puis flèches sur le repère pour le déplacer' : undefined}
          onKeyDown={e => { if (placing && observation && e.key === 'Enter' && e.target === e.currentTarget) { e.preventDefault(); place(observation.id, { x: .5, y: .5 }); setPlacing(false); } }}
          onClick={e => { if (suppressClick.current) { suppressClick.current = false; return; }
            if (placing && observation) { place(observation.id, pointAt(e)); setPlacing(false); } }}>
          <img src={plan.src} alt={plan.title} width={plan.width} height={plan.height} draggable={false} />
          {markers.map(marker => {
            const point = dragPoint?.observationId === marker.observationId ? dragPoint : marker;
            return <button data-readonly-view key={marker.observationId} type="button"
              className={`plan-marker${marker.observationId === observation.id ? ' selected' : ''}`}
              style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
              aria-label={`Repère ${marker.number} — ${marker.title}`} title={`${marker.number}. ${marker.title}`}
              onClick={e => { e.stopPropagation(); suppressClick.current = false; chooseObservation(marker.observationId); }}
              onPointerDown={e => { if (readOnly) return; e.stopPropagation(); if (e.button !== 0) return; e.currentTarget.setPointerCapture(e.pointerId);
                chooseObservation(marker.observationId); dragRef.current = { id: marker.observationId, x: e.clientX, y: e.clientY, moved: false }; }}
              onPointerMove={e => { const drag = dragRef.current; if (!drag || drag.id !== marker.observationId) return;
                if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 3) drag.moved = true;
                if (drag.moved) setDragPoint({ ...pointAt(e), observationId: drag.id }); }}
              onPointerUp={e => { const drag = dragRef.current; if (!drag) return;
                if (drag.moved) { place(drag.id, pointAt(e)); suppressClick.current = true; }
                dragRef.current = null; setDragPoint(null); }}
              onPointerCancel={() => { dragRef.current = null; setDragPoint(null); }}
              onKeyDown={e => { if (readOnly) return; const deltas = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
                if (deltas[e.key]) { e.preventDefault(); const step = e.shiftKey ? .01 : .002;
                  place(marker.observationId, { x: marker.x + deltas[e.key][0] * step, y: marker.y + deltas[e.key][1] * step }); } }}>
              {marker.number}
            </button>;
          })}
        </div>
      </div>
      <p role="status">{message || `${markers.length} repère(s) sur cette vue.`}</p>
      <ul className="plan-legend">{markers.map(marker => <li key={marker.observationId}><button data-readonly-view type="button" onClick={() => chooseObservation(marker.observationId)}>
        <strong>{marker.number}.</strong> {marker.title}</button></li>)}</ul>
      <details><summary>Informations sur la vue</summary>
        <div className="plan-toolbar">
          <label>Titre de la vue<input value={plan.title} maxLength={200} onChange={e => updatePlan({ title: e.target.value })} /></label>
          <label>Type de vue<select value={plan.kind} onChange={e => updatePlan({ kind: e.target.value })}>{Object.entries(PLAN_KINDS).map(([kind, label]) => <option key={kind} value={kind}>{label}</option>)}</select></label>
          <label>Source de la vue<input value={plan.source} maxLength={1000} onChange={e => updatePlan({ source: e.target.value })} /></label>
        </div>
        <p>Le fond est conservé à l’identique pour que les repères ne changent pas d’emplacement.</p>
        {removeId !== plan.id ? <button type="button" className="button ghost" onClick={() => setRemoveId(plan.id)} disabled={busy || readOnly}>Retirer cette vue</button>
          : <div className="plan-remove-confirm" role="group" aria-label="Confirmation du retrait de la vue">
            <p>Retirer « {plan.title} » et ses {markers.length} repère(s) ? Les observations et leurs autres vues seront conservées.</p>
            <div className="plan-actions"><button type="button" className="button secondary" onClick={() => setRemoveId('')}>Annuler le retrait</button>
              <button type="button" className="button ghost" disabled={busy || readOnly} onClick={deleteView}>Confirmer le retrait de la vue</button></div>
          </div>}
      </details>
      </div></div>
    </>}
  </section>;
}
