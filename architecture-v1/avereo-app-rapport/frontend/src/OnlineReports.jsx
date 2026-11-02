import React, { useEffect, useState } from 'react';
import { listOnlineReports, loadOnlineReport } from './services/reportApi.js';

export default function OnlineReports({ token, draft, onOpen, onBackup }) {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [opening, setOpening] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    listOnlineReports(token).then((items) => { if (active) setReports(items); })
      .catch((failure) => { if (active) setError(failure.message); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [token, refresh]);

  const open = async (item) => {
    setOpening(true);
    setError('');
    try {
      const saved = await loadOnlineReport(item.id, token);
      if (!saved?.payload || typeof saved.payload !== 'object' || Array.isArray(saved.payload)) {
        throw new Error('Le rapport reçu est incomplet. Le brouillon actuel est conservé.');
      }
      await onOpen({ ...saved.payload, onlineReportId: saved.id });
    } catch (failure) {
      setError(failure.message || 'Réouverture impossible. Le brouillon actuel est conservé.');
    } finally {
      setOpening(false);
    }
  };

  return <section className="panel online-reports" aria-labelledby="online-reports-title">
    <h3 id="online-reports-title">Rapports sauvegardés en ligne</h3>
    <p>Les 50 derniers rapports auxquels votre compte a accès. Une sauvegarde en ligne est distincte du brouillon de ce navigateur.</p>
    <button className="button secondary" type="button" disabled={loading || opening}
      onClick={() => setRefresh((value) => value + 1)}>Actualiser la liste</button>
    {loading && <p role="status">Chargement des rapports…</p>}
    {error && <p className="status-line warning" role="alert">{error}</p>}
    {!loading && !error && !reports.length && <p>Aucun rapport sauvegardé en ligne pour ce compte.</p>}
    {!loading && <ul className="online-report-list">{reports.map((item) => <li key={item.id}>
      <div><strong>{item.reference || item.title || 'Rapport sans titre'}</strong>
        <p>{item.address || 'Adresse non renseignée'} · dernière sauvegarde : {item.updatedAt}</p></div>
      <button className="button secondary" type="button" disabled={opening}
        onClick={() => draft ? setSelected(item) : open(item)}>Ouvrir</button>
    </li>)}</ul>}
    {selected && <div className="preview-notice" role="region" aria-label="Confirmer la réouverture">
      <div>
        <p><strong>Ouvrir {selected.reference || selected.title} ?</strong></p>
        <p>La copie en ligne remplacera le brouillon de ce navigateur. Exportez ce brouillon si vous souhaitez conserver ses dernières modifications.</p>
        <div className="home-actions">
          <button className="button secondary" type="button" onClick={onBackup}>Exporter le brouillon JSON</button>
          <button className="button ghost" type="button" disabled={opening} onClick={() => setSelected(null)}>Annuler</button>
          <button className="button primary" type="button" disabled={opening} onClick={() => open(selected)}>
            {opening ? 'Ouverture…' : 'Ouvrir la copie en ligne'}
          </button>
        </div>
      </div>
    </div>}
  </section>;
}
