import React, { useEffect, useRef, useState } from 'react';
import { applyRgaContext, buildRgaMapUrl, normalizeRgaCartography, rgaLevelLabel } from './rgaContext.js';
import useRgaAccess from './useRgaAccess.js';

export default function RgaMap({ report, setReport }) {
  const allowed = useRgaAccess();
  const frame = useRef(null);
  const [open, setOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const url = buildRgaMapUrl(report);
  const reading = normalizeRgaCartography(report.rga_cartographie, report.cadastre?.lon, report.cadastre?.lat);
  useEffect(() => { setNotice(''); }, [url]);
  useEffect(() => {
    const receive = event => {
      if (!allowed || event.origin !== window.location.origin || event.source !== frame.current?.contentWindow) return;
      if (event.data?.type !== 'avereo.rga.context.v1') return;
      const updated = applyRgaContext(report, event.data);
      if (!updated) { setNotice('Résultat non repris : vérifiez le point du bien et la date de consultation.'); return; }
      setReport(prev => applyRgaContext(prev, event.data) || prev);
      setNotice('Lecture RGA reprise dans ce dossier. Elle suit sa sauvegarde et ses exports.');
    };
    window.addEventListener('message', receive);
    return () => window.removeEventListener('message', receive);
  }, [report, setReport, allowed]);
  return <div>
    {reading && <div className="notice">
      <p><strong>Lecture de la carte 2026 : {reading.level ? `exposition ${rgaLevelLabel(reading.level)}` : reading.status === 'outside_coverage' ? 'hors couverture' : 'zone non classée dans les contours affichés'}.</strong></p>
      <p>{reading.source} — {new Date(reading.fetchedAt).toLocaleString('fr-FR')}.</p>
      <p>{reading.limitation}</p>
    </div>}
    {!allowed && <p className="notice">L’accès RGA est indépendant de Rapport. <a href={url} target="_blank" rel="noopener noreferrer">Ouvrir RGA dans CONNECT</a>, puis revenir dans ce dossier.</p>}
    <button className="button secondary" type="button" disabled={!allowed} onClick={() => setOpen(value => !value)}>
      {open ? 'Fermer la carte RGA' : 'Voir la nouvelle carte RGA au point du bien'}
    </button>{' '}
    <a className="button ghost" href={url} target="_blank" rel="noopener noreferrer">Ouvrir en plein écran</a>
    {open && allowed && <iframe ref={frame} key={url} src={url} title="Carte RGA au point du bien"
      referrerPolicy="no-referrer" style={{ width: '100%', height: '760px', border: '1px solid #b6c7ca', marginTop: '16px', borderRadius: '8px' }} />}
    {notice && <p role="status">{notice}</p>}
    <p className="muted">La carte représente le contexte territorial. La synthèse Géorisques datée ci-dessus est conservée avec le rapport ; une zone non affichée ne signifie pas absence de risque.</p>
  </div>;
}
