import React, { useEffect, useRef, useState } from 'react';
import OrganizationExports from './OrganizationExports.jsx';
import { onlineReportPage, loadOnlineReport } from './services/reportApi.js';

export default function OnlineReports({ token, draft, onOpen, onBackup }) {
  const [reports, setReports] = useState([]);
  const [canExport, setCanExport] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null);
  const [opening, setOpening] = useState(false);
  const [refresh, setRefresh] = useState(0);

  const [query, setQuery] = useState('');
  const [limit, setLimit] = useState(5);
  const confirmation = useRef(null);
  const trigger = useRef(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    setSelected(null);
    setReports([]);
    setCanExport(false);
    const timer = setTimeout(async () => {
      try {
        const page = await onlineReportPage(token, { query, limit, signal: controller.signal });
        if (!controller.signal.aborted) {
          setReports(page.reports || []);
          setCanExport(page.organizationExportsAvailable === true);
        }
      } catch (failure) {
        if (!controller.signal.aborted) setError(failure.message);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, query.trim() ? 200 : 0);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [token, refresh, query, limit]);

  useEffect(() => {
    if (selected) {
      confirmation.current?.focus({ preventScroll: true });
      confirmation.current?.scrollIntoView({ block: 'nearest' });
    }
  }, [selected]);

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
    <div className="online-report-filters">
      <label>Rechercher un rapport
        <input type="search" value={query} maxLength={190} disabled={opening}
          placeholder="Référence, titre ou adresse" onChange={event => setQuery(event.target.value)} />
      </label>
      <label>Afficher
        <select value={limit} disabled={opening} onChange={event => setLimit(Number(event.target.value))}>
          <option value={5}>5 derniers enregistrements</option>
          <option value={50}>50 derniers enregistrements</option>
        </select>
      </label>
      <button className="button secondary" type="button" disabled={loading || opening}
        onClick={() => setRefresh(value => value + 1)}>Actualiser</button>
    </div>
    {loading && <p role="status">Chargement des rapports…</p>}
    {error && <p className="status-line warning" role="alert">{error}</p>}
    {selected && <div className="preview-notice" role="region" aria-label="Confirmer la réouverture" tabIndex={-1} ref={confirmation}>
      <div>
        <p><strong>Ouvrir {selected.reference || selected.title || 'Rapport sans titre'} ?</strong></p>
        <p>La copie en ligne remplacera le brouillon de ce navigateur. Exportez ce brouillon si vous souhaitez conserver ses dernières modifications.</p>
        <div className="home-actions">
          <button className="button secondary" type="button" onClick={onBackup}>Exporter le brouillon JSON</button>
          <button className="button ghost" type="button" disabled={opening} onClick={() => { setSelected(null); trigger.current?.focus(); }}>Annuler</button>
          <button className="button primary" type="button" disabled={opening} onClick={() => open(selected)}>
            {opening ? 'Ouverture…' : 'Ouvrir la copie en ligne'}
          </button>
        </div>
      </div>
    </div>}
    {!loading && !error && !reports.length && <p>{query.trim() ? 'Aucun rapport ne correspond à cette recherche.' : 'Aucun rapport sauvegardé en ligne pour ce compte.'}</p>}
    {!loading && <ul className="online-report-list">{reports.map((item) => <li key={item.id}>
      <div><strong>{item.reference || item.title || 'Rapport sans titre'}</strong>
        {item.reference && item.title && item.title !== item.reference && <p>{item.title}</p>}
        <p>{item.address || 'Adresse non renseignée'} · dernière sauvegarde : {item.updatedAt}</p></div>
      <button className="button secondary" type="button" disabled={opening}
        onClick={event => { trigger.current = event.currentTarget; if (draft) setSelected(item); else open(item); }}>Ouvrir</button>
    </li>)}</ul>}
    {canExport && <OrganizationExports />}
  </section>;
}
