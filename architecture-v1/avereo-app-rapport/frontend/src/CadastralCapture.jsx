import React, { useEffect, useRef, useState } from 'react';
import { CadastralMap } from './LocationMap.jsx';
import { locationConfirmed, validLocation } from './locationMap.js';
import { attachPlanViews, captureCadastralView, captureTarget } from './cadastralCapture.js';
import { useReadOnlyMode } from './ReadOnlyFields.jsx';
import { MAX_PLANS } from './observationPlans.js';

export default function CadastralCapture({ report, setReport, onPhotoTransfer, onAdded }) {
  const readOnly = useReadOnlyMode();
  const latest = useRef(report), controller = useRef(null);
  latest.current = report;
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [addedId, setAddedId] = useState('');
  const [mode, setMode] = useState('cadastre'), [alsoCadastre, setAlsoCadastre] = useState(false);
  const [opened, setOpened] = useState(false);
  const target = captureTarget(report);
  useEffect(() => { setBusy(false); return () => controller.current?.abort(); }, [target]);
  const added = (report.plans || []).some(plan => plan.id === addedId);
  const ready = validLocation(report.cadastre?.lon, report.cadastre?.lat) && locationConfirmed(report);

  async function capture(view) {
    if (busy || !ready || readOnly) return;
    const task = new AbortController(); controller.current = task;
    setBusy(true); setMessage(''); setAddedId(''); onPhotoTransfer(1);
    try {
      const signal = AbortSignal.any([task.signal, AbortSignal.timeout(45000)]);
      const modes = alsoCadastre && view.mode !== 'cadastre' ? [view.mode, 'cadastre'] : [view.mode];
      if ((latest.current.plans || []).length + modes.length > MAX_PLANS) throw new Error('20 vues maximum par dossier.');
      const plans = [];
      for (const mode of modes) {
        const plan = await captureCadastralView({ ...view, mode }, signal);
        plan.localisation = { adresse: report.adresse_logement, lon: report.cadastre.lon, lat: report.cadastre.lat };
        plans.push(plan);
      }
      if (task.signal.aborted || captureTarget(latest.current) !== target) return;
      // Validate against the most recent dossier before handing the attachment to React.
      attachPlanViews(latest.current, plans, target);
      setReport(previous => {
        try { return attachPlanViews(previous, plans, target); }
        catch { return previous; } // A concurrent size/plan change must never replace a dossier.
      });
      setAddedId(plans[0].id);
      onAdded?.(plans[0].id);
    } catch (error) {
      if (!task.signal.aborted) setMessage(error.name === 'TimeoutError'
        ? 'Le fond du terrain ne répond pas. Réessayez ou importez une image de plan.'
        : `${error.message} Vous pouvez importer une image de plan.`);
    } finally { onPhotoTransfer(-1); if (controller.current === task) setBusy(false); }
  }

  return <details className="terrain-capture" onToggle={event => setOpened(event.currentTarget.open)}>
    <summary>Récupérer une vue du terrain</summary>
    <p>Cadrez la propriété en déplaçant et en zoomant la carte, puis enregistrez cette vue avant de placer les repères T1, T2…</p>
    <div className="plan-toolbar"><label>Fond à enregistrer<select data-readonly-view value={mode} disabled={busy} onChange={event => setMode(event.target.value)}>
      <option value="cadastre">Cadastre</option><option value="satellite">Satellite — vue aérienne</option>
      <option value="satellite_parcelles">Satellite + parcelles</option>
    </select></label>
    {mode !== 'cadastre' && <label className="checkbox"><input data-readonly-view type="checkbox" checked={alsoCadastre} disabled={busy}
      onChange={event => setAlsoCadastre(event.target.checked)} />Enregistrer aussi le cadastre au même cadrage</label>}</div>
    {!ready ? <p>Confirmez d’abord le lieu dans Site. Vous pouvez aussi importer un plan et continuer sans carte.</p>
      : opened && <CadastralMap lon={report.cadastre.lon} lat={report.cadastre.lat} mode={mode}
        captureBusy={busy || readOnly} onCapture={capture} />}
    {busy && <p role="status">Enregistrement de la vue du terrain…</p>}
    {message && <p role="alert">{message}</p>}
    {addedId && <p role="status">{added
      ? 'Vue ajoutée à la bibliothèque et sélectionnée pour le repérage ; les fonds antérieurs sont conservés.'
      : 'La vue n’a pas été ajoutée car le dossier a changé. Réessayez sur ce dossier.'}</p>}
    <p>Le fond enregistré reste fixe dans le dossier et les Word. Le zoom de consultation ne déplace pas les repères ; un autre cadrage ajoute une nouvelle vue.</p>
    <p className="muted">Satellite : photographies aériennes IGN, avec ou sans parcelles. La date d’enregistrement n’est pas la date de prise de vue.</p>
  </details>;
}
