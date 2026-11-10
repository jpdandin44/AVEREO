import React, { useEffect, useState } from 'react';
import { saveAs } from './saveAs.js';
import { listOrganizationExports, downloadOrganizationReport } from './services/reportApi.js';

export default function OrganizationExports() {
  const [reference, setReference] = useState('');
  const [filter, setFilter] = useState('');
  const [reports, setReports] = useState([]);
  const [purpose, setPurpose] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true); setError(''); setReports([]);
    listOrganizationExports(filter, controller.signal)
      .then(items => { if (!controller.signal.aborted) setReports(items); })
      .catch(() => { if (!controller.signal.aborted) setError('Les dossiers autorisés sont indisponibles.'); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [filter]);

  async function download(id) {
    setBusy(true); setError('');
    try {
      const blob = await downloadOrganizationReport(id, purpose);
      saveAs(blob, `rapport-${id}.json`);
    } catch (failure) {
      setError(failure.message);
    } finally {
      setBusy(false);
    }
  }

  return <section aria-labelledby="export-organizations-title">
    <h3 id="export-organizations-title">Exports autorisés par organisation</h3>
    <form className="online-report-filters" onSubmit={event => { event.preventDefault(); setFilter(reference.trim()); }}>
      <label>Référence exacte du dossier<input value={reference} maxLength={190}
        onChange={event => setReference(event.target.value)} /></label>
      <button className="button secondary" type="submit">Rechercher</button>
    </form>
    <label>Motif de l’export<select value={purpose} onChange={event => setPurpose(event.target.value)}>
      <option value="">Choisir un motif</option><option value="assistance">Assistance</option>
      <option value="continuite">Continuité du dossier</option><option value="test_autorise">Test autorisé</option>
    </select></label>
    {error && <p role="alert">{error}</p>}
    {loading ? <p role="status">Chargement…</p> : !error && reports.length === 0 && <p>Aucun dossier autorisé pour cette recherche.</p>}
    <ul className="online-report-list">{reports.map(report => <li key={report.id}>
      <div><strong>{report.reference || report.title || 'Rapport'}</strong><p>Organisation n° {report.organizationId}</p></div>
      <button className="button secondary" type="button" disabled={!purpose || busy}
        onClick={() => download(report.id)}>Télécharger le JSON complet</button>
    </li>)}</ul>
  </section>;
}
