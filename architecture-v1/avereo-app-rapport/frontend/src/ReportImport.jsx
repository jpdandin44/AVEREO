import React, { useEffect, useRef, useState } from 'react';
import { MAX_REPORT_BYTES } from './observationPlans.js';
import { independentReport, readReportFile, reportContentSummary, requireEditableNumbers } from './reportFiles.js';

export default function ReportImport({ draft, onBackup, onLoad, disabled = false }) {
  const [candidate, setCandidate] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const input = useRef(null);
  const dialog = useRef(null);
  const generation = useRef(0);
  useEffect(() => () => { generation.current += 1; }, []);
  useEffect(() => {
    if (!candidate) return undefined;
    const previous = document.activeElement;
    const element = dialog.current;
    element.showModal();
    return () => { element.close(); previous?.focus(); };
  }, [candidate]);

  const choose = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    const current = ++generation.current;
    setError('');
    if (file.size > MAX_REPORT_BYTES) {
      setError('Import JSON refusé : taille maximale 50 Mio. Le brouillon actuel est conservé.');
      return;
    }
    setBusy(true);
    try {
      const report = readReportFile(await file.text());
      requireEditableNumbers(report);
      const summary = reportContentSummary(report);
      if (generation.current === current) setCandidate({ report, summary, name: file.name });
    } catch (failure) {
      if (generation.current === current) setError(failure.message);
    } finally {
      if (generation.current === current) setBusy(false);
    }
  };
  const load = async () => {
    setBusy(true);
    setError('');
    try {
      await onLoad(independentReport(candidate.report));
      setCandidate(null);
    } catch (failure) { setError(failure.message || 'Chargement impossible. Le brouillon actuel est conservé.'); }
    finally { setBusy(false); }
  };
  return <div className="report-import">
    <button type="button" className="button secondary" disabled={busy || disabled} onClick={() => input.current?.click()}>
      {busy && !candidate ? 'Lecture du fichier…' : 'Charger un dossier JSON'}
    </button>
    <input ref={input} type="file" accept=".json,application/json" className="visually-hidden" onChange={choose} aria-label="Choisir un dossier JSON" />
    {!candidate && error && <p role="alert" className="error-text">{error}</p>}
    {candidate && <dialog ref={dialog} className="report-import-dialog" aria-labelledby="report-import-title"
      onCancel={event => { event.preventDefault(); if (!busy) setCandidate(null); }}>
      <h2 id="report-import-title">Vérifier le dossier à charger</h2>
      <p>{candidate.name}</p>
      <p><strong>{candidate.report.reference_dossier || candidate.report.titre || 'Dossier sans référence'}</strong></p>
      <p>{candidate.summary.observations} observation(s), {candidate.summary.photos} photo(s), {candidate.summary.plans} plan(s), signature {candidate.summary.signature ? 'présente' : 'absente'}.</p>
      {candidate.summary.structureOnly
        ? <p className="status-line warning" role="alert"><strong>Copie de structure pour les tests.</strong> Les textes, photos, plans et la signature ont été retirés. Ce fichier ne permet pas de retrouver le contenu original. Demandez un export JSON complet pour récupérer le dossier.</p>
        : <p>Les données et images présentes dans ce fichier seront chargées dans le dossier.</p>}
      <p>{draft ? 'Ce chargement remplacera le brouillon de ce navigateur après confirmation. Exportez-le avant de continuer si nécessaire. ' : ''}Une sauvegarde en ligne de cet import créera un dossier indépendant sous votre compte et conservera le dossier source.</p>
      {error && <p role="alert" className="error-text">{error}</p>}
      <div className="home-actions">
        {draft && <button type="button" className="button secondary" onClick={onBackup} disabled={busy}>Exporter le brouillon avant de continuer</button>}
        <button type="button" className="button ghost" onClick={() => setCandidate(null)} disabled={busy}>Annuler</button>
        <button type="button" className="button primary" onClick={load} disabled={busy}>
          {busy ? 'Chargement…' : candidate.summary.structureOnly ? 'Charger la structure de test' : 'Charger le dossier complet'}
        </button>
      </div>
    </dialog>}
  </div>;
}
