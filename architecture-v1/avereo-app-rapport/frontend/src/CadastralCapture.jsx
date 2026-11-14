import React, { useEffect, useRef, useState } from 'react';
import { CadastralMap } from './LocationMap.jsx';
import { locationConfirmed, validLocation } from './locationMap.js';
import { attachCadastralPlan, captureCadastralView, captureTarget } from './cadastralCapture.js';

export default function CadastralCapture({ report, setReport, onPhotoTransfer }) {
  const latest = useRef(report), controller = useRef(null);
  latest.current = report;
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [addedId, setAddedId] = useState('');
  const target = captureTarget(report);
  useEffect(() => { setBusy(false); return () => controller.current?.abort(); }, [target]);
  const added = (report.plans || []).some(plan => plan.id === addedId);
  const ready = validLocation(report.cadastre?.lon, report.cadastre?.lat) && locationConfirmed(report);

  async function capture(view) {
    if (busy || !ready) return;
    const task = new AbortController(); controller.current = task;
    setBusy(true); setMessage(''); setAddedId(''); onPhotoTransfer(1);
    try {
      const plan = await captureCadastralView(view, AbortSignal.any([task.signal, AbortSignal.timeout(25000)]));
      plan.localisation = { adresse: report.adresse_logement, lon: report.cadastre.lon, lat: report.cadastre.lat };
      if (task.signal.aborted || captureTarget(latest.current) !== target) return;
      // Validate against the most recent dossier before handing the attachment to React.
      attachCadastralPlan(latest.current, plan, target);
      setReport(previous => {
        try { return attachCadastralPlan(previous, plan, target); }
        catch { return previous; } // A concurrent size/plan change must never replace a dossier.
      });
      setAddedId(plan.id);
    } catch (error) {
      if (!task.signal.aborted) setMessage(error.name === 'TimeoutError'
        ? 'Le fond cadastral ne répond pas. Réessayez ou importez une image de plan.'
        : `${error.message} Vous pouvez importer une image de plan.`);
    } finally { onPhotoTransfer(-1); if (controller.current === task) setBusy(false); }
  }

  return <details className="terrain-capture">
    <summary>Préparer le fond cadastral du terrain</summary>
    <p>Cadrez la propriété en déplaçant et en zoomant la carte, puis enregistrez cette vue avant de placer les repères T1, T2…</p>
    {!ready ? <p>Confirmez d’abord le lieu dans Site. Vous pouvez aussi importer un fond cadastral ci-dessous et continuer sans carte.</p>
      : <CadastralMap lon={report.cadastre.lon} lat={report.cadastre.lat} mode="cadastre"
        captureBusy={busy} onCapture={capture} />}
    {busy && <p role="status">Enregistrement du fond cadastral…</p>}
    {message && <p role="alert">{message}</p>}
    {addedId && <p role="status">{added
      ? 'Vue cadastrale ajoutée dans « Vue affichée ». Choisissez-la pour placer les repères ; les fonds antérieurs sont conservés.'
      : 'La vue n’a pas été ajoutée car le dossier a changé. Réessayez sur ce dossier.'}</p>}
    <p>Le fond enregistré reste fixe dans le dossier et les Word. Le zoom de consultation ne déplace pas les repères ; un autre cadrage ajoute une nouvelle vue.</p>
  </details>;
}
