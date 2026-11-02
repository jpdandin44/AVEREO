import React, { useRef, useState } from 'react';
import { MAX_PLANS, MAX_REPORT_BYTES, markersForPlan, planPayloadError, readPlanFile, setObservationPoint } from './observationPlans.js';
import './observationPlans.css';

export default function ObservationPlans({ report, setReport, selectedId, onSelect }) {
  const [viewId, setViewId] = useState('');
  const [zoom, setZoom] = useState(100);
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [dragPoint, setDragPoint] = useState(null);
  const stageRef = useRef(null), dragRef = useRef(null), suppressClick = useRef(false), latestReport = useRef(report);
  latestReport.current = report;
  const plans = report.plans || [];
  const plan = plans.find(p => p.id === viewId) || plans[0];
  const observation = report.observations.find(o => o.id === selectedId) || report.observations[0];
  const number = report.observations.indexOf(observation) + 1;
  const markers = plan ? markersForPlan(report, plan.id) : [];
  const current = markers.find(p => p.observationId === observation?.id);
  const chooseObservation = id => { onSelect(id); setPlacing(false); setMessage(''); };
  const pointAt = event => {
    const rect = stageRef.current.getBoundingClientRect();
    return { x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)),
      y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height)) };
  };
  const place = (id, point) => {
    setReport(previous => setObservationPoint(previous, id, plan.id, point));
    setMessage(point ? 'Repère mis à jour dans le dossier.' : 'Repère retiré de cette vue.');
  };
  const importPlans = async event => {
    const files = Array.from(event.target.files || []); event.target.value = '';
    if (!files.length) return;
    setError(''); setBusy(true);
    try {
      if (plans.length + files.length > MAX_PLANS) throw new Error('20 vues maximum par dossier.');
      const imported = [];
      for (const file of files) imported.push(await readPlanFile(file));
      const previous = latestReport.current;
      const next = { ...previous, plans: [...(previous.plans || []), ...imported] };
      const invalid = planPayloadError(next);
      if (invalid) throw new Error(invalid);
      if (new Blob([JSON.stringify(next)]).size > MAX_REPORT_BYTES) throw new Error('Le dossier dépasse 50 Mio. Réduisez le poids des images avant import.');
      setReport(next); setViewId(imported[0].id); setPlacing(false); setMessage(`${imported.length} vue(s) ajoutée(s).`);
    } catch (failure) { setError(failure.message); }
    finally { setBusy(false); }
  };
  const updatePlan = patch => setReport(previous => ({ ...previous, plans: previous.plans.map(p => p.id === plan.id ? { ...p, ...patch } : p) }));
  return <section className="observation-plans" id="observation-plans" tabIndex={-1} aria-label="Repérage sur plans et coupes">
    <h3>Repérage sur plans et coupes</h3>
    <p>Choisissez une observation et une vue, puis placez son repère. Le même numéro suit le constat sur chaque vue et dans le Word.</p>
    <label className="plan-import">Ajouter des plans ou des coupes
      <input type="file" multiple accept="image/png,image/jpeg" onChange={importPlans} disabled={busy} />
    </label>
    <p className="muted">PNG ou JPEG, 4 Mio par image. Les vues sont conservées dans ce dossier. Repérage indicatif, sans mesure automatique.</p>
    {busy && <p role="status">Lecture des images…</p>}
    {error && <p role="alert" className="error-text">{error}</p>}
    {!plan ? <p>Aucune vue ajoutée. Vous pouvez continuer à décrire la pièce ou la zone dans chaque observation.</p> : <>
      <div className="plan-toolbar">
        <label>Vue affichée<select value={plan.id} onChange={e => { setViewId(e.target.value); setZoom(100); setPlacing(false); }}>
          {plans.map(p => <option key={p.id} value={p.id}>{p.title} · {p.kind === 'coupe' ? 'Coupe' : 'Niveau'}</option>)}
        </select></label>
        <label>Observation à repérer<select value={observation?.id || ''} onChange={e => chooseObservation(e.target.value)}>
          {report.observations.map((o, i) => <option key={o.id} value={o.id}>{i + 1}. {o.titre || o.piece || 'Sans titre'}</option>)}
        </select></label>
        <label>Zoom {zoom} %<input type="range" min="100" max="300" step="25" value={zoom} onChange={e => setZoom(Number(e.target.value))} /></label>
      </div>
      <div className="plan-actions">
        <button type="button" className={`button ${placing ? 'primary' : 'secondary'}`} aria-pressed={placing}
          onClick={() => setPlacing(!placing)}>{placing ? 'Annuler le placement' : current ? 'Déplacer le repère' : 'Placer le repère'}</button>
        {current && <button type="button" className="button ghost" onClick={() => place(observation.id, null)}>Retirer ce repère</button>}
        <button type="button" className="button ghost" onClick={() => document.getElementById(`observation-${observation.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Voir la fiche {number}</button>
      </div>
      <p className="plan-instruction" role="status">{placing ? `Cliquez ou touchez la vue pour placer le repère ${number}.` : 'Sélectionnez un repère pour retrouver sa fiche. Déplacez-le par glissement ou avec les flèches du clavier.'}</p>
      <div className="plan-scroll">
        <div ref={stageRef} className={`plan-stage${placing ? ' is-placing' : ''}`} style={{ width: `${zoom}%` }} tabIndex={placing ? 0 : -1}
          aria-label={placing ? 'Zone de placement : Entrée pour poser le repère au centre, puis flèches sur le repère pour le déplacer' : undefined}
          onKeyDown={e => { if (placing && e.key === 'Enter' && e.target === e.currentTarget) { e.preventDefault(); place(observation.id, { x: .5, y: .5 }); setPlacing(false); } }}
          onClick={e => { if (suppressClick.current) { suppressClick.current = false; return; }
            if (placing && observation) { place(observation.id, pointAt(e)); setPlacing(false); } }}>
          <img src={plan.src} alt={plan.title} width={plan.width} height={plan.height} draggable={false} />
          {markers.map(marker => {
            const point = dragPoint?.observationId === marker.observationId ? dragPoint : marker;
            return <button key={marker.observationId} type="button"
              className={`plan-marker${marker.observationId === observation.id ? ' selected' : ''}`}
              style={{ left: `${point.x * 100}%`, top: `${point.y * 100}%` }}
              aria-label={`Repère ${marker.number} — ${marker.title}`} title={`${marker.number}. ${marker.title}`}
              onClick={e => { e.stopPropagation(); suppressClick.current = false; chooseObservation(marker.observationId); }}
              onPointerDown={e => { e.stopPropagation(); if (e.button !== 0) return; e.currentTarget.setPointerCapture(e.pointerId);
                chooseObservation(marker.observationId); dragRef.current = { id: marker.observationId, x: e.clientX, y: e.clientY, moved: false }; }}
              onPointerMove={e => { const drag = dragRef.current; if (!drag || drag.id !== marker.observationId) return;
                if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 3) drag.moved = true;
                if (drag.moved) setDragPoint({ ...pointAt(e), observationId: drag.id }); }}
              onPointerUp={e => { const drag = dragRef.current; if (!drag) return;
                if (drag.moved) { place(drag.id, pointAt(e)); suppressClick.current = true; }
                dragRef.current = null; setDragPoint(null); }}
              onPointerCancel={() => { dragRef.current = null; setDragPoint(null); }}
              onKeyDown={e => { const deltas = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
                if (deltas[e.key]) { e.preventDefault(); const step = e.shiftKey ? .01 : .002;
                  place(marker.observationId, { x: marker.x + deltas[e.key][0] * step, y: marker.y + deltas[e.key][1] * step }); } }}>
              {marker.number}
            </button>;
          })}
        </div>
      </div>
      <p role="status">{message || `${markers.length} repère(s) sur cette vue.`}</p>
      <ul className="plan-legend">{markers.map(marker => <li key={marker.observationId}><button type="button" onClick={() => chooseObservation(marker.observationId)}>
        <strong>{marker.number}.</strong> {marker.title}</button></li>)}</ul>
      <details><summary>Informations sur la vue</summary>
        <div className="plan-toolbar">
          <label>Titre de la vue<input value={plan.title} maxLength={200} onChange={e => updatePlan({ title: e.target.value })} /></label>
          <label>Type de vue<select value={plan.kind} onChange={e => updatePlan({ kind: e.target.value })}><option value="niveau">Plan de niveau</option><option value="coupe">Coupe</option></select></label>
          <label>Source de la vue<input value={plan.source} maxLength={1000} onChange={e => updatePlan({ source: e.target.value })} /></label>
        </div>
        <p>Le fond est conservé à l’identique pour que les repères ne changent pas d’emplacement.</p>
      </details>
    </>}
  </section>;
}
